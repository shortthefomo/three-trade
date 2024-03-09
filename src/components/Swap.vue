<template>
    <!-- <p v-if="deliver">deliver: {{amount}} {{currencyHexToUTF8(deliver.split(':')[0])}}</p> -->
    <div v-if="path?.alternatives" class="p-0 m-2 dark-background border border-1 p-2 col-xl-2 col-md-3 col-12 fs-7"  v-for="(alt, index) in path?.alternatives">
        <div class="p-2 mb-2 mt-2 container-fluid">
            <div class="mx-1 row">
                <div v-if="typeof alt.source_amount === 'object'" class="col-12 text-center">{{ currencyHexToUTF8(alt.source_amount.currency)}}</div>
                <div v-if="typeof alt.source_amount === 'object'" class="col-12 text-center"><small>{{ alt.paths_computed[0][0]?.account}}</small></div>
                <div v-if="typeof alt.source_amount === 'object'" class="col-12 mt-3 text-center"><h5>{{ alt.source_amount.value }}</h5></div>

                <div v-if="typeof alt.source_amount !== 'object'" class="col-12 text-center">{{ $store.getters.getNetwork === 'xahau' ? 'XAU':'XRP' }}</div>
                <div v-if="typeof alt.source_amount !== 'object'" class="col-12 text-center"><small>-</small></div>
                <div v-if="typeof alt.source_amount !== 'object'" class="col-12 mt-3 text-center"><h5>{{ alt.source_amount / 1_000_000 }}</h5></div>

                
            </div>
            <div class="mx-1 mt-3 row">
                <div class="col-12 text-center"><button>pay</button></div>
                <!-- <div v-if="(alt.source_amount.currency === 'XAH' || alt.source_amount.currency === 'XRP') && currencyHexToUTF8(deliver.split(':')[0]).includes('USD')" class="col-12 mt-3 text-center">rate: {{ numeralFormat(amount/alt.source_amount.value, '0,0[.]00000') }} </div> -->
                <div v-if="alt.source_amount.currency !== undefined && (currencyHexToUTF8(deliver.split(':')[0]).includes('USD'))" class="col-12 mt-3 text-center">rate: {{ numeralFormat(amount/alt.source_amount.value, '0,0[.]00000') }} {{ currencyHexToUTF8(alt.source_amount.currency) }}</div>
                <div v-else-if="alt.source_amount.currency !== undefined && (currencyHexToUTF8(alt.source_amount.currency).includes('USD'))" class="col-12 mt-3 text-center">rate: {{ numeralFormat(amount/alt.source_amount.value, '0,0[.]00000') }} {{ currencyHexToUTF8(deliver.split(':')[0]) }}</div>
                <div v-if="typeof alt.source_amount !== 'object'" class="col-12 mt-3 text-center">rate: {{ numeralFormat((alt.source_amount/1_000_000)/amount, '0,0[.]000000')  }} {{ $store.getters.getNetwork === 'xahau' ? 'XAU':'XRP' }}</div>
                <div v-if="typeof alt.source_amount !== 'object'  " class="col-12 text-center">inv: {{ numeralFormat(amount/(alt.source_amount/1_000_000), '0,0[.]000000')  }} {{ $store.getters.getNetwork === 'xahau' ? 'XRP':'XAU' }}</div>
            </div>
        </div>
    </div>
</template>

<script>
import { EventEmitter } from 'events'
import { XrplClient } from 'xrpl-client'

export default {
    name: 'Path',
    props: ['deliver', 'amount'],
    data() {
        return {
            client: undefined,
            loaded: false,
            last_id: undefined,
            await: false
        }
    },
    mounted() {
        // console.log('mounted.... path', this.exchange_key)
        EventEmitter.defaultMaxListeners = 128

        // this.pathing()
    },
    computed: {
        path() {
            const xpath = this.$store.getters.getPath('swap-' + this.deliver + '-' + this.amount)
            return xpath?.path
        },
    },
    watch: {
        deliver(value) {
            console.log('deliver changed')
            this.awaitChange()
        },
        amount(value) {
            console.log('Amount changed')
            this.awaitChange()
        }
    },
    methods: {
        async awaitChange() {
            if (this.await) { return }
            this.await = true
            await this.pause(1200)
            console.log('resume post pause')
            if (this.last_id !== undefined) {
                await this.client.send({
                    'id': this.last_id,
                    'command': 'path_find',
                    'subcommand': 'close'
                })
                this.last_id = undefined
                this.$store.dispatch('updatePath', { key: 'swap-' + this.deliver + '-' + this.amount, path: {}})
            }
            
            this.loaded = true
            this.pathing()
            this.await = false
        },
        async pathing() {
            if (this.deliver === undefined) { return }
            if (this.amount === undefined) { return }
            
            if (!this.loaded) {
                await this.pause()
                return await this.pathing()
            }
            this.current_address = this.$store.getters.getAccount
            // we need a new connection for each pathfind...
            this.client = new XrplClient(this.$store.getters.getClientServers)

            const self = this
            this.last_id = 'swap-' + this.deliver + '-' + this.amount
            const cmd = {
                id: 'swap-' + this.deliver + '-' + this.amount,
                command: 'path_find',
                subcommand: 'create',
                source_account: this.$store.getters.getAccount,
                destination_account: this.$store.getters.getAccount,
                destination_amount: {
                    value: String(this.amount),
                    currency: this.deliver.split(':')[0],
                    issuer: this.deliver.split(':')[1]
                }
            }
            console.log('cmd', cmd)
            const result = await this.client.send(cmd)
            
            console.log('path init', result)
            this.$store.dispatch('updatePath', { key: result.id, path: result.result})

            this.client.on('path', (path) => {
                if ('error' in path) { return }
                if ('alternatives' in path) {
                    self.$store.dispatch('updatePath', { key: path.id, path: path}) 
                }
                console.log('path', path)
            })
            this.client.on('close', () => {
                console.log('close')
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