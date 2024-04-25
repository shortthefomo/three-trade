<template>

    <!-- <div class="p-2 mb-2 mt-2 container-fluid">
        <div class="asks mx-1 row" v-for="(row, index) in book.book.asks.slice(10 - items, 10)">
            <span class="depth" :style="'transform:scale3d(' + ask_depth(index) + ', 1, 1) ;'"> </span>
            <div class="col">{{format(row['limit_price'])}} {{quote}}</div>
            <div class="col">{{numeralFormat(row['amount'], '0,0[.]0000000000')}}</div>
            <div class="col address" v-if="show_addresses"><small>{{row['address']}}</small></div>
        </div>
    </div> -->

    <!-- <h5>{{ exchange.base }}<span>{{(exchange.base_issuer !== undefined ? ':' + exchange.base_issuer : '')}}</span> - {{ exchange.quote}}<span>{{ (exchange.quote_issuer !== undefined ? ':' + exchange.quote_issuer : '' )}}</span></h5> -->
    <h5>{{exchange.name}}</h5>
    <div class="p-0 dark-background border border-3 fs-7">
        <div v-if="book.asks.length>0" class="p-2 mb-2 mt-2 container-fluid">
            <!-- <div class="asks mx-1 row" v-for="(row, index2) in book.asks.slice(book.asks.length - items, book.asks.length)"> -->
            <div class="asks mx-1 row" v-for="(row, index2) in book.asks">
                <span class="depth" :style="'transform:scale3d(' + ask_depth(index2) + ', 1, 1) ;'"> </span>
                <div class="col text-start">{{format(row['limit_price'])}} {{currencyHexToUTF8(exchange.quote)}}</div>
                <div class="col text-start">{{format(row['amount'])}}</div>
                <div class="col text-start" v-if="quality && (row['quality'] < 1)">{{format(row['quality'])}}</div> 
                <div class="col text-start" v-else-if="quality">{{format(1/row['quality'])}}</div> 
                <div class="col address" v-if="addresses && $store.getters.getNetwork === 'mainnet'"><small><a :href="`https://xrpscan.com/account/${row['address']}`" target="_blank">{{row['address']}}</a></small></div>
                <div class="col address" v-if="addresses && $store.getters.getNetwork === 'xahau'"><small><a :href="`https://xahscan.com/account/${row['address']}`" target="_blank">{{row['address']}}</a></small></div>
            </div>
        </div>
        <h4 class="my-1 mx-1 fs-6 ms-4">{{format( midPrice())}} {{ currencyHexToUTF8(exchange.base) }}/{{ currencyHexToUTF8(exchange.quote) }}</h4>
        <div v-if="book.bids.length>0" class="p-2 mb-2 mt-2 container-fluid">
            <!-- <div class="bids mx-1 row" v-for="(row, index2) in book.bids.slice(0, items)"> -->
            <div class="bids mx-1 row" v-for="(row, index2) in book.bids">
                <span class="depth" :style="'transform:scale3d(' + bid_depth(index2) + ', 1, 1) ;'"> </span>
                <div class="col text-start">{{format(row['limit_price'])}} {{currencyHexToUTF8(exchange.quote)}}</div>
                <div class="col text-start">{{format(row['amount'])}}</div>
                <div class="col text-start" v-if="quality && (row['quality'] < 1)">{{format(row['quality'])}}</div> 
                <div class="col text-start" v-else-if="quality">{{format(1/row['quality'])}}</div> 
                <div class="col address" v-if="addresses  && $store.getters.getNetwork === 'mainnet'"><small><a :href="`https://xrpscan.com/account/${row['address']}`" target="_blank">{{row['address']}}</a></small></div>
                <div class="col address" v-if="addresses  && $store.getters.getNetwork === 'xahau'"><small><a :href="`https://xahscan.com/account/${row['address']}`" target="_blank">{{row['address']}}</a></small></div>
            </div>
        </div>
    </div>
    <div class="p-0 dark-background border border-1 fs-7">
        <div v-if="book.asks.length>0 && book.bids.length>0" class="p-2 mb-2 mt-2 container-fluid">
            <div class="split">
                <span class="depth" :style="'transform:scale3d(' + asks_split() + ', 1, 1) ;'"> </span>
            </div>
        </div>
    </div>
    <div class="info mx-1 p-2 border border-1 fs-8">
        <!-- <span v-if="getFX(exchange.quote, exchange.base) !== undefined">fx: {{getFX(exchange.quote, exchange.base)}} {{ exchange.base }}</span>
        <span v-else-if="getOracle(exchange.quote, exchange.base) !== undefined">oracle: {{getOracle(exchange.quote, exchange.base)}}</span><br/> -->
        <span v-if="book.asks.length>0 && book.bids.length>0">spread: {{(spread())}} {{currencyHexToUTF8(exchange.quote)}} : {{ format(spreadPercent()) }} % </span><br/>
        <span v-if="book.asks.length>0"><span class="color-success">asks: {{numeralFormat(asks(), '0,0[.]0')}} {{currencyHexToUTF8(exchange.base)}}</span> </span><br/>
        <span v-if="book.bids.length>0"><span class="color-danger">bids: {{numeralFormat(bids(), '0,0[.]0')}} {{currencyHexToUTF8(exchange.base)}}</span> </span><br/>
        <!-- <h6><span>asks: {{exchange.book.asks.length}}</span></h6>
        <h6><span>bids: {{exchange.book.bids.length}}</span></h6> -->

        <!-- button v-if="($store.getters.getNetwork === 'mainnet' && exchange.quote !== 'XRP') || ($store.getters.getNetwork === 'xahau' && exchange.quote !== 'XAH')" v-on:click="showPath" type="button" class="btn btn-purple me-1 mt-3 fs-8">{{ pathing ? 'hide':'show' }} paths</button>
        <Path :exchange_key="exchange_key" :exchange="exchange" :loaded="isLoading" :active="pathing"/ -->
    </div>
    
        
</template>

<script>
import { debounce } from 'lodash'
import decimal from 'decimal.js'
import Path from './Path.vue'

export default {
    name: 'Book',
    props: ['exchange_key', 'items', 'col', 'addresses', 'fx', 'oracle', 'quality'],
    components: {
        Path
    },
    data() {
        return {
            client: null,
            debouncedBook: null,
            bookSkipCount: 0,
            book: {
                bids: [],
                asks: []
            },
            isLoading: true,
            pathing: false
        }
    },
    created() {
        if (this.debouncedBook !== null) { return }
        this.debouncedBook = debounce(data => {
            const max = (data.asks.length - this.items < 0) ? 0 :  data.asks.length - this.items
            const result = {
                asks: (this.items > 0) ? [...data.asks.slice(max, data.asks.length)] : [...data.asks],
                bids: (this.items > 0) ? [...data.bids.slice(0, this.items)] : [...data.bids],
            }
            this.bookSkipCount = 0
            // only update the book if they are different!
            if (JSON.stringify(result) === JSON.stringify(this.book)) { return }
            this.book = result
            
        }, 100)
        // console.log('debouncedBook: ' + this.exchange_key)
    },
    beforeUnmount() {
        if (this.debouncedBook === null) { return }
        this.debouncedBook.cancel()
    },
    mounted() {
        // console.log('mounted.... dep', this.exchange_key)
        
    },
    computed: {
        exchange() {
            return this.$store.getters.getExchangeBook(this.exchange_key)
        },
        offers() {
            // console.log('offers', this.$store.getters.getExchangeBook(this.exchange_key).book)
            return this.$store.getters.getExchangeBook(this.exchange_key).book
        },
        path() {
            const xpath = this.$store.getters.getPath(this.exchange_key)
            return xpath.path
        },

    },
    watch: {
        offers(newValue) {
            this.bookSkipCount++
            if (this.bookSkipCount > 50) {
                const max = (data.asks.length - this.items < 0) ? 0 :  data.asks.length - this.items
                this.book = {
                    asks: (this.items > 0) ? [...data.asks.slice(max, data.asks.length)] : [...data.asks],
                    bids: (this.items > 0) ? [...data.bids.slice(0, this.items)] : [...data.bids],
                }
                this.bookSkipCount = 0
            }
            else {
                this.debouncedBook(newValue)
            }
            if (this.book.asks.length > 0) {
                this.isLoading = false
            }
        },  
    },
    methods: {
        showPath() {
            this.pathing = !this.pathing
        },
        spread() {
            if (this.book.asks.length === 0 || this.book.bids.length === 0) { return 0 }
            //return new decimal(this.book.asks[0].limit_price).toFixed(8)
            const value = new decimal(this.book.asks[this.book.asks.length-1].limit_price).minus(this.book.bids[0].limit_price).toFixed(8)
            if ((value*1)< 1) {
                return value
            }
            return new decimal(this.book.asks[this.book.asks.length-1].limit_price).minus(this.book.bids[0].limit_price).toFixed(2)
        },
        spreadPercent() {
            return decimal.mul(this.spread(), '100').div(this.midPrice())
        },
        midPrice() {
            if (this.book.asks.length === 0 || this.book.bids.length === 0) { return 0 }
            // return new decimal(this.book.bids[0].limit_price).toFixed(8)
            return (new decimal(this.book.bids[0].limit_price).plus(this.book.asks[this.book.asks.length-1].limit_price)).div('2')
        },
        format(value) {
            if ((value * 1) > 10) {
                return this.numeralFormat(value, '0,0[.]00')
            }
            if ((value * 1 ) < 0.1) {
                return decimal(value).toFixed(10)
            }
            return this.numeralFormat(value, '0,0[.]0000000000')
        },
        asks_split() {
            let sum = this.bids() + this.asks()
            return decimal.div(this.asks(), sum).toFixed()
        },
        bid_depth(index2) {
            let sum = 0
            for (let index = 0; index <= index2; index++) {
                sum = decimal.sum(sum, this.book.bids[index].amount)
            }
            const total = (this.bids() > this.asks()) ? this.bids() : this.asks() //this.bids() //
            return decimal.div(sum, total).toFixed()
        },
        ask_depth(index2) {
            let sum = 0
            for (let index = this.book.asks.length -1; index >= index2; index--) {
                sum = decimal.sum(sum, this.book.asks[index].amount)
            }

            const total = (this.bids() > this.asks()) ? this.bids() : this.asks() //this.asks() //
            
            return decimal.div(sum, total).toFixed()
        },
        bids() {
            let total = 0
            for (let index = 0; index < this.book.bids.length; index++) {
                total = decimal.sum(total, this.book.bids[index].amount)
            }
            return new decimal(total).toNumber()
        },
        asks() {
            let total = 0
            for (let index = 0; index < this.book.asks.length; index++) {
                total = decimal.sum(total, this.book.asks[index].amount)
            }
            return new decimal(total).toNumber()
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
        getFX(quote, base) {
            // console.log('qq', quote, base)
            for (let index = 0; index < this.fx.length; index++) {
                const element = this.fx[index]
                // console.log('element.source', element.source)
                if (element.source == base&& element.target == quote ) {
                    return element.rate
                }
            }
            return undefined
        },
        getOracle(quote, base) {
            // console.log('qq', quote, base)
            if (this.oracle[this.currencyHexToUTF8(quote)] !== undefined) {
                return this.oracle[this.currencyHexToUTF8(quote)]
            }
            return undefined
        },
        async pause(milliseconds = 1000) {
            return new Promise(resolve =>  {
                console.log('pausing....')
                setTimeout(resolve, milliseconds)
            })
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
.asks, .bids, .split {
    position: relative;
}
.split .depth {
    position: absolute;
    background-color: rgba(0, 229, 106, 0.1);
    transform-origin: left;
    top: 0;
    bottom: 0;
    z-index: 0;
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