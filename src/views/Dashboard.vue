<template>
    <div class="m-2 home">
        <div class="row mb-2">
            <div class="col">
                <h1>trade {{ network }}</h1>
            </div>
        </div>
        <div class="row mb-2">
            <div class="col">
                <label class="pe-2">Network</label>
                <select v-model="network" @change="onChangeNetwork($event)">
                    <option v-for="option in networks" :value="option.value">
                        {{ option.text }}
                    </option>
                </select>
            </div>
        </div>
        <div class="row mb-2">
            <div class="col">
                <label class="pe-2">Book Rows</label>
                <select v-model="items">
                    <option v-for="option in options" :value="option.value">
                        {{ option.text }}
                    </option>
                </select>
            </div>
        </div>
        <div class="row mb-2">
            <div class="col">
                <label class="pe-2">Layout Columns</label>
                <select v-model="col">
                    <option v-for="option in cols" :value="option.value">
                        {{ option.text }}
                    </option>
                </select>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col">
                <button v-on:click="showAddresses" type="button" class="btn btn-warning me-1 mt-3 fs-8">{{ addresses ? 'hide' : 'show' }} address</button>
            </div>
        </div>
        
        <div class="row">
            
            <div v-for="(book, index) in trade_books" :class="'mb-5 ' + 'col-' + col">
                <Book v-if="network === book.network" :oracle="oracle" :fx="fx" :exchange_key="book.base + book.base_issuer + book.quote + book.quote_issuer + '-' + book.network" :items="items" :col="col" :addresses="addresses" />
            </div>
        </div>

        <div class="row mb-2">
            <div class="col-6">
                <div class="input-group mb-3">
                    <label for="address" class="me-3 form-label">r-address</label>
                    <input type="text" class="active form-control" id="address" v-model="address" placeholder="rThREeXrp54XTQueDowPV1RxmkEAGUmg8">
                    <button v-on:click="updateAddress" type="button" class="btn btn-warning">update</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Book from '../components/Book.vue'

export default {
    name: 'Dashboard',
    components: {
        Book
    },
    data() {
        return {
            address: 'rThREeXrp54XTQueDowPV1RxmkEAGUmg8',
            addresses: false,
            options: [
                { text: 'all', value: 0 },
                { text: 10, value: 10 },
                { text: 15, value: 15 },
                { text: 25, value: 25 }
            ],
            items: 10,
            cols: [
                { text: 4, value: 3 },
                { text: 3, value: 4 },
                { text: 2, value: 6 },
                { text: 1, value: 12 }
            ],
            networks: [
                { text: 'mainnet', value: 'mainnet' },
                { text: 'xahau', value: 'xahau' },
            ],
            network: 'mainnet',
            col: 3,
            client: undefined,
            socketFX: null,
            socket: null,
            fx: [],
            oracle: []
        }
    },
    mounted() {
        const self = this
        console.log('Dashboard mounted')
        this.setMainnet()

        this.connectWebsocket()
        this.forex()
    },
    computed: {
        trade_books() {
            return this.$store.getters.getBooks
        }
    },
    methods: {
        onChangeNetwork(event) {
            console.log('event', event.target.value)
            switch (event.target.value) {
                case 'xahau':
                    this.setXahau()
                    break
            
                default:
                    this.setMainnet()
                    break
            }
        },
        setMainnet() {
            this.$store.dispatch('setNetwork', 'mainnet')
            this.$store.dispatch('clearBooks')
            
            const nodes = import.meta.env.VITE_APP_XRPL_WSS.split(', ')
            this.$store.dispatch('setClientServers', nodes)
            this.$store.dispatch('clientConnect', false)

            this.client = this.$store.getters.getClient
                this.client.on('ledger', async (event) => {
                // console.log('event', event)
                this.monitor()
            })
            const books = [{
                type: 'DEX',
                network: 'mainnet',
                name: 'Bitstamp',
                market: 'XRPUSD',
                base: 'XRP',
                quote: 'USD',
                base_issuer: undefined,
                quote_issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Gatehub',
                market: 'XRPUSD',
                base: 'XRP',
                quote: 'USD',
                base_issuer: undefined,
                quote_issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Gatehub',
                market: 'XRPUSDT',
                base: 'XRP',
                quote: '5553445400000000000000000000000000000000',
                base_issuer: undefined,
                quote_issuer: 'rcvxE9PS9YBwxtGg1qNeewV6ZB3wGubZq'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Gatehub',
                market: 'XRPUSDC',
                base: 'XRP',
                quote: '5553444300000000000000000000000000000000',
                base_issuer: undefined,
                quote_issuer: 'rcEGREd8NmkKRE8GE424sksyt1tJVFZwu'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Gatehub',
                market: 'XRPXAH',
                base: 'XRP',
                quote: 'XAH',
                base_issuer: undefined,
                quote_issuer: 'rswh1fvyLqHizBS2awu1vs6QcmwTBd9qiv'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Gatehub',
                market: 'XAHUSD',
                base: 'XAH',
                quote: 'USD',
                base_issuer: 'rswh1fvyLqHizBS2awu1vs6QcmwTBd9qiv',
                quote_issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Gatehub',
                market: 'XAHEUR',
                base: 'XAH',
                quote: 'EUR',
                base_issuer: 'rswh1fvyLqHizBS2awu1vs6QcmwTBd9qiv',
                quote_issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Gatehub',
                market: 'XRPEUR',
                base: 'XRP',
                quote: 'EUR',
                base_issuer: undefined,
                quote_issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Bitstamp',
                market: 'XRPEUR',
                base: 'XRP',
                quote: 'EUR',
                base_issuer: undefined,
                quote_issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Bitstamp',
                market: 'XRPBTC',
                base: 'XRP',
                quote: 'BTC',
                base_issuer: undefined,
                quote_issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Gatehub',
                market: 'XRPBTC',
                base: 'XRP',
                quote: 'BTC',
                base_issuer: undefined,
                quote_issuer: 'rchGBxcD1A1C2tdxF6papQYZ8kjRKMYcL'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Bitstamp-Gatehub',
                market: 'USDUSD',
                base: 'USD',
                quote: 'USD',
                base_issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                quote_issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Gatehub-Gatehub',
                market: 'USDEUR',
                base: 'USD',
                quote: 'EUR',
                base_issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
                quote_issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'Bitstamp-Gatehub',
                market: 'USDEUR',
                base: 'USD',
                quote: 'EUR',
                base_issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                quote_issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'xToadz',
                market: 'XRPRIBBITS',
                base: 'XRP',
                quote: '5249424249545300000000000000000000000000',
                base_issuer: undefined,
                quote_issuer: 'rPmb5BPBAbE9jmNaFXNPH5kZEPDpRxaY77'
            }, {
                type: 'DEX',
                network: 'mainnet',
                name: 'X-Fox Club',
                market: 'XRPFOX',
                base: 'XRP',
                quote: '464F580000000000000000000000000000000000',
                base_issuer: undefined,
                quote_issuer: 'rfox8eXfYYj476pLGmAr79sxcY6FsyfNHp'
            }]
            
            this.$store.dispatch('setAccount', this.address)
            for (let index = 0; index < books.length; index++) {
                const book = books[index]
                this.$store.dispatch('listenBook', book)    
            }
            this.serverInfo()
        },
        setXahau() {
            this.$store.dispatch('setNetwork', 'xahau')
            this.$store.dispatch('clearBooks')
            
            const nodes = import.meta.env.VITE_APP_XAH_WSS.split(', ')
            this.$store.dispatch('setClientServers', nodes)
            this.$store.dispatch('clientConnect', false)

            this.client = this.$store.getters.getClient
                this.client.on('ledger', async (event) => {
                // console.log('event', event)
                this.monitor()
            })
            const books = [{
                type: 'DEX',
                network: 'xahau',
                name: 'Gatehub',
                market: 'XAHUSD',
                base: 'XAH',
                quote: 'USD',
                base_issuer: undefined,
                quote_issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
            }, {
                type: 'DEX',
                network: 'xahau',
                name: 'Gatehub',
                market: 'XAHEUR',
                base: 'XAH',
                quote: 'EUR',
                base_issuer: undefined,
                quote_issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
            }, {
                type: 'DEX',
                network: 'xahau',
                name: 'Gatehub',
                market: 'XAHXRP',
                base: 'XAH',
                quote: 'XRP',
                base_issuer: undefined,
                quote_issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq'
            }]
            this.$store.dispatch('setAccount', this.address)
            for (let index = 0; index < books.length; index++) {
                const book = books[index]
                this.$store.dispatch('listenBook', book)    
            }
            this.serverInfo()
        },
        updateAddress() {
            console.log('updateAddress')
            this.$store.dispatch('setAccount', this.address)
        },
        connectWebsocket() {
            const self = this
            this.socket = new WebSocket('wss://three-oracle.panicbot.xyz')
            this.socket.onmessage = function (message) {
                
                // self.oracle = []
                const data = JSON.parse(message.data)
                if ('oracle' in data) {
                    Object.entries(data.oracle).forEach(([key, value]) => {
                        if (key === 'USD') {
                            //self.usd = value.Price
                        }
                        if (key !== 'STATS') {
                            // console.log(value)
                            self.oracle[value.Token] = value.Price
                        }
                        else {
                            // self.stats = value
                        }
                    })
                }
            }
            this.socket.onclose = function (close) {
                self.oracle = []
            }
        },
        async serverInfo(){
            this.client = this.$store.getters.getClient
            const info = await this.client.send({
                'command': 'server_info'
            })

            console.log(info)
        },
        forex() {
            const self = this
            this.socketFX = new WebSocket('wss://three-forex.panicbot.xyz')
            this.socketFX.onmessage = function (message) {
                const data = JSON.parse(message.data)
                if ('rates' in data) {
                    self.fx = data.rates
                }
            }
            this.socketFX.onclose = function (close) {
                self.fx = []
            }
        },
        showAddresses() {
            console.log('show_addresses clicked...')
            this.addresses = !this.addresses
        },
        monitor() {
            const worker = async (book) => {
                if (this.$store.getters.getNetwork !== book.network) { return }
                const asks_books = {
                    'id': 2,
                    'command': 'book_offers',
                    'taker': this.$store.getters.getAccount,
                    'taker_gets': {'currency': book.quote, 'issuer': book.quote_issuer},
                    'taker_pays': {'currency': book.base }
                }
                if (book.base_issuer !== undefined) {
                    asks_books.taker_pays.issuer = book.base_issuer
                }
                const bids_books = {
                    'id': 3,
                    'command': 'book_offers',
                    'taker': this.$store.getters.getAccount,
                    'taker_gets': {'currency': book.base},
                    'taker_pays': {'currency': book.quote, 'issuer': book.quote_issuer }
                }    
                if (book.base_issuer !== undefined) {
                    bids_books.taker_gets.issuer = book.base_issuer
                }

                // console.log('bids_books', bids_books)
                const book_result = await Promise.all([
                    this.client.send(asks_books),
                    this.client.send(bids_books),
                ])

                // console.log('book_result', book_result)

                if ('error' in book_result) { return }
                const book_offers = {
                    'asks': book_result[1].offers,
                    'bids': book_result[0].offers
                }
                const data = this.mutateData(book_offers, (book.base_issuer !== undefined))
                
                // console.log('data', data)
                
                this.$store.dispatch('updateBook', {
                    key: book.base + book.base_issuer + book.quote + book.quote_issuer + '-' + book.network,
                    book: data,
                    network: book.network
                })
            }
            
            const books = this.$store.getters.getBooks
            for (const [key, book] of Object.entries(books)) {
                if (book.type === 'DEX') {
                    worker(book)
                }
            }
        },
        ledgerEpoch() {
            const unix_time = Date.now() 
            return Math.floor((unix_time) / 1000) - 946684800
        },
        mutateData(data, xrp_base) {
            const results = {
                bids: {},
                asks: {}
            }

            if (data.asks === undefined) { data.asks = [] }
            if (data.bids === undefined) { data.bids = [] }

            for (let index = 0; index < data.bids.length; index++) {
                const offer = data.bids[index]
                let TakerPays = offer.TakerPays.value || offer.TakerPays / 1_000_000
                let TakerGets = offer.TakerGets.value || offer.TakerGets / 1_000_000
                let taker_pays_funded 
                if (offer.taker_pays_funded !== undefined) {
                    taker_pays_funded = offer.taker_pays_funded.value || offer.taker_pays_funded / 1_000_000
                }
                // let taker_gets_funded = offer.taker_gets_funded.value || offer.taker_gets_funded / 1_000_000

                // console.log(offer)
                if ('Expiration' in offer && offer.Expiration < this.ledgerEpoch()) { continue }
                if (offer.Account == this.$store.getters.getAccount) { continue }
                    
                const price = 1 / ((TakerPays) / TakerGets)
                // todo conver this to use decimal js..
                const volume = ('taker_pays_funded' in offer && (taker_pays_funded * 1 > 0)) ? taker_pays_funded : TakerPays
                // if (isNaN(volume)) {
                //     console.log('nan A', offer)
                // }
                if (price in results.bids) {
                    results.bids[price].amount += volume
                    continue
                }
                results.bids[price] = {
                    amount: volume,
                    limit_price: price,
                    address: offer.Account,
                    quality: offer.quality
                }
            }

            for (let index = 0; index < data.asks.length; index++) {
                const offer = data.asks[index]
                let TakerPays = offer.TakerPays.value || offer.TakerPays / 1_000_000
                let TakerGets = offer.TakerGets.value || offer.TakerGets / 1_000_000
                let taker_gets_funded 
                if (offer.taker_gets_funded !== undefined) {
                    taker_gets_funded = offer.taker_gets_funded.value || offer.taker_gets_funded / 1_000_000
                }
                // let taker_gets_funded = offer.taker_gets_funded.value || offer.taker_gets_funded / 1_000_000


                if ('Expiration' in offer && offer.Expiration < this.ledgerEpoch()) { continue }
                if (offer.Account == this.$store.getters.getAccount) { continue }

                const price = 1 / (TakerGets / TakerPays)
                // todo conver this to use decimal js..
                const volume = ('taker_gets_funded' in offer) ? taker_gets_funded : TakerGets
                // if (isNaN(volume)) {
                //     console.log('nan B', offer)
                //     console.log('taker_gets_funded', taker_gets_funded)
                // }
                if (price in results.asks) {
                    results.asks[price].amount += volume
                    continue
                }
                results.asks[price] = {
                    amount: volume,
                    limit_price: price,
                    address: offer.Account,
                    quality: 1/offer.quality
                }
            }
            return results
        },
        fromDrops(value, xrp_base) {
            if (!xrp_base) {
                return value / 1_000_000
            }
            if (typeof value === 'object') {
                return value.value * 1
            }
            return value * 1
        }
    }
}
</script>

<style lang="scss" scoped>
.home {
    color: #ffffff;
}

.graph {
    border: 3px dashed #383838;
}

h1 {
    font-family: "Minecraft";
    font-size: 7em;
    background-image: url("https://media.istockphoto.com/id/1356593931/vector/pixel-art-starry-seamless-background-night-sky-in-8-bit-style.jpg?s=612x612&w=0&k=20&c=2XLKJXACSfqoayBwN03t-PTElY52pkjNtV1cTvYHMi4=");
    color: #fff;
    color: transparent;
    background-size: contain;
    -webkit-background-clip: text;
    filter: drop-shadow(0px -3px 1px rgba(0, 0, 0, 1));
    animation: stripes 5s infinite alternate;
  }

@keyframes stripes {
  100% {
    background-position: 100px 0, 100px 0, 100px 0;
  }
}

@font-face {font-family: "Minecraft"; src: url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.eot"); src: url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.eot?#iefix") format("embedded-opentype"), url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.woff2") format("woff2"), url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.woff") format("woff"), url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.ttf") format("truetype"), url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.svg#Minecraft") format("svg"); }
</style>
