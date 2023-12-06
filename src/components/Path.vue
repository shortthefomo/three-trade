<template>
    <div v-if="active && $store.getters.getPath(exchange_key) !== undefined && 'alternatives' in path">
        <hr>
        <h6>paths</h6>
        <p v-if="(typeof path.destination_amount === 'object')">deliver: {{ numeralFormat(path.destination_amount.value, '0,0[.]0000000000') }} {{ currencyHexToUTF8(path.destination_amount.currency) }}</p>
        <p v-else>deliver: {{ numeralFormat(path.destination_amount/1_000_000, '0,0[.]0000000000') }} XRP</p>
        <span v-if="path.alternatives !== undefined">
            <span v-for="(alt, index) in path.alternatives">
                <span v-if="(typeof alt.source_amount === 'object')">{{ numeralFormat(alt.source_amount.value, '0,0[.]0000000000') }} {{ currencyHexToUTF8(alt.source_amount.currency) }} {{ printPath(alt) }}</span>
                <span v-else>{{ numeralFormat(alt.source_amount/1_000_000,  '0,0[.]0000000000') }} XRP {{ printPath(alt) }}</span><br/>
            </span>
        </span>
        <span v-if="path.alternatives === undefined ||path.alternatives.length === 0 ">No path found</span>
    </div>
</template>

<script>
import { EventEmitter } from 'events'
import { XrplClient } from 'xrpl-client'

export default {
    name: 'Path',
    props: ['exchange_key', 'exchange', 'loaded', 'active'],
    data() {
        return {
            client: null,
            current_address: '',
            show_steps: true
        }
    },
    mounted() {
        // console.log('mounted.... path', this.exchange_key)
        EventEmitter.defaultMaxListeners = 128

        // this.pathing()
    },
    computed: {
        path() {
            const xpath = this.$store.getters.getPath(this.exchange_key)
            return xpath.path
        },
    },
    watch: {
        async active(newValue) {
            // console.log('active', newValue)
            if (newValue && this.client == null) {
                this.pathing()
                return
            }

            if (this.client !== null) {
                await this.client.close()
                this.client = null
            }
        }
    },
    methods: {
        printPath(alt) {
            let string = ''
            if (alt.paths_computed === undefined || alt.paths_computed.length === 0 || !this.show_steps) { return string }
            string += '[* '
            for (let index = 0; index < alt.paths_computed.length; index++) {
                const elements = alt.paths_computed[index]
                elements.forEach(element => {
                    if ('currency' in element) {
                        string += '->' + this.currencyHexToUTF8(element.currency)
                    }    
                })
            }
            string += ']'
            return string
        },
        async pathing() {
            if (this.loaded) {
                await this.pause()
                return await this.pathing()
            }
            this.current_address = this.$store.getters.getAccount
            // we need a new connection for each pathfind...
            if (this.client === null) {
                this.client = new XrplClient(this.$store.getters.getClientServers)    
            }
            const self = this
            const cmd = {
                id: this.exchange_key,
                command: 'path_find',
                subcommand: 'create',
                source_account: this.$store.getters.getAccount,
                destination_account: this.$store.getters.getAccount,
                destination_amount: {
                    value: '1',  //String(this.book.bids[0].limit_price),
                    currency: this.exchange.quote,
                    issuer: this.exchange.quote_issuer
                }
            }
            console.log('cmd', cmd)
            const result = await this.client.send(cmd)
            
            console.log('path init', result)
            this.$store.dispatch('updatePath', { key: result.id, path: result.result})

            this.client.on('path', (path) => {
                if (self.current_address !== self.$store.getters.getAccount) {
                    console.log('switch pathing....')
                    self.pathing()
                    return
                }
                if ('alternatives' in path) {
                    self.$store.dispatch('updatePath', { key: path.id, path: path}) 
                }
                console.log('path', path)
            })
            this.client.on('close', () => {
                console.log('close')
                self.$store.dispatch('updatePath', { key: self.exchange_key, path: {}})
            })
            this.client.on('error', (error) => {
                console.log('error', error)
            })
        },
        async pause(milliseconds = 1000) {
            return new Promise(resolve =>  {
                console.log('pausing....')
                setTimeout(resolve, milliseconds)
            })
        },
        currencyHexToUTF8(code) {
            if (code.length === 3)
                return code
            let decoded = new TextDecoder().decode(this.hexToBytes(code))
            let padNull = decoded.length
            while (decoded.charAt(padNull - 1) === '\0')
                padNull--
            return decoded.slice(0, padNull)
        },
        hexToBytes(hex) {
            let bytes = new Uint8Array(hex.length / 2)
            for (let i = 0; i !== bytes.length; i++) {
                bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
            }
            return bytes
        },
    }
}
</script>
<style>
.fs-7 {
    font-size: 0.7rem !important;
}
.fs-8 {
    font-size: 0.6rem !important;
}
.asks, .bids {
    position: relative;
}
.asks .depth {
    position: absolute;
    background-color: rgba(0, 229, 106, 0.1);
    transform-origin: left;
    top: 0;
    bottom: 0;
    z-index: 0;
}

.bids .depth {
    position: absolute;
    background-color: rgba(255, 26, 139, 0.1);
    transform-origin: left;
    top: 0;
    bottom: 0;
    z-index: 0;
}
.asks a {
    text-decoration: none;
    color: #00e56a;
    z-index: 1;
}
.bids a {
    text-decoration: none;
    color: #FF1A8B;
    z-index: 1;
}
.asks .col , .asks .col-4 {
    color: #00e56a;
}
.bids .col, .bids .col-4 {
    color: #FF1A8B;
}
.bids .address, .asks .address {
    width: 325px;
    text-align: right;
    z-index: 1;
}

.table-success {
    --bs-table-bg: #00e56a;
    --bs-table-striped-bg: #00e56a;
    --bs-table-striped-color: #000;
    --bs-table-active-bg: #00e56a;
    --bs-table-active-color: #000;
    --bs-table-hover-bg: #00e56a;
    --bs-table-hover-color: #000;
    color: #000;
    border-color: #00e56a;
}

.table-danger {
    --bs-table-bg: #FF1A8B;
    --bs-table-striped-bg: #FF1A8B;
    --bs-table-striped-color: #000;
    --bs-table-active-bg: #FF1A8B;
    --bs-table-active-color: #000;
    --bs-table-hover-bg: #FF1A8B;
    --bs-table-hover-color: #000;
    color: #000;
    border-color: #FF1A8B;
}

.table-success-opaque {
    --bs-table-bg: rgba(0, 229, 106, 0.6);
    --bs-table-striped-bg: rgba(0, 229, 106, 0.6);
    --bs-table-striped-color: #000;
    --bs-table-active-bg: rgba(0, 229, 106, 0.6);
    --bs-table-active-color: #000;
    --bs-table-hover-bg: rgba(0, 229, 106, 0.6);
    --bs-table-hover-color: #000;
    color: #000;
    border-color: rgba(0, 229, 106, 0.6);
}

.table-danger-opaque {
    --bs-table-bg: rgba(255, 26, 139, 0.6);
    --bs-table-striped-bg: rgba(255, 26, 139, 0.6);
    --bs-table-striped-color: #000;
    --bs-table-active-bg: rgba(255, 26, 139, 0.6);
    --bs-table-active-color: #000;
    --bs-table-hover-bg: rgba(255, 26, 139, 0.6);
    --bs-table-hover-color: #000;
    color: #000;
    border-color: rgba(255, 26, 139, 0.6);
}

.color-danger {
    color: #FF1A8B;
}
.color-success {
    color:#00e56a;
}

.dark-background {
    color: #FFFFFF;
    background-color: rgb(31, 31, 31);
}

.border-purple.rounded-3 {
    border-color: rgba(116, 62, 226, 0.6) !important;
}

.table-arb-opaque {
  --bs-table-bg: rgba(116, 62, 226, 0.6);
  --bs-table-striped-bg: rgba(116, 62, 226, 0.6);
  --bs-table-striped-color: #000;
  --bs-table-active-bg: rgba(116, 62, 226, 0.6);
  --bs-table-active-color: #000;
  --bs-table-hover-bg: rgba(116, 62, 226, 0.6);
  --bs-table-hover-color: #000;
  color: #FFFFFF !important;
  border-color: rgba(116, 62, 226, 0.6);
}

.table-warning-opaque {
    --bs-table-bg: rgba(255, 193, 7, 0.6);
    --bs-table-striped-bg: rgba(255, 193, 7, 0.6);
    --bs-table-striped-color: #000;
    --bs-table-active-bg: rgba(255, 193, 7, 0.6);
    --bs-table-active-color: #000;
    --bs-table-hover-bg: rgba(255, 193, 7, 0.6);
    --bs-table-hover-color: #000;
    color: #000;
    border-color: rgba(255, 193, 7, 0.6);
}
</style>