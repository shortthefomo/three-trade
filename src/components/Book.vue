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
        <div v-if="book.bids.length>0" class="p-2 mb-2 mt-2 container-fluid">
            <!-- <div class="asks mx-1 row" v-for="(row, index2) in book.asks.slice(book.asks.length - items, book.asks.length)"> -->
            <div class="asks mx-1 row" v-for="(row, index2) in book.asks">
                <span class="depth" :style="'transform:scale3d(' + ask_depth(index2) + ', 1, 1) ;'"> </span>
                <div class="col text-start">{{format(row['limit_price'])}} {{exchange.quote}}</div>
                <div class="col text-start">{{row['amount']}}</div>
                <div class="col address" v-if="addresses"><small>{{row['address']}}</small></div>
            </div>
        </div>
        <h4 class="my-1 mx-1 fs-6 ms-4">{{format( midPrice())}} {{ exchange.base }}/{{ exchange.quote }}</h4>
        <div v-if="book.asks.length>0" class="p-2 mb-2 mt-2 container-fluid">
            <!-- <div class="bids mx-1 row" v-for="(row, index2) in book.bids.slice(0, items)"> -->
            <div class="bids mx-1 row" v-for="(row, index2) in book.bids">
                <span class="depth" :style="'transform:scale3d(' + bid_depth(index2) + ', 1, 1) ;'"> </span>
                <div class="col text-start">{{format(row['limit_price'])}} {{exchange.base}}</div>
                <div class="col text-start">{{row['amount']}}</div>
                <div class="col address" v-if="addresses"><small>{{row['address']}}</small></div>
            </div>
        </div>
    </div>

    <div class="info mx-1 p-2 pt-4 border border-1 fs-8">
        <span v-if="book.asks.length>0 && book.bids.length>0">spread: {{(spread())}} {{exchange.quote}} : {{ format(spreadPercent()) }} % </span><br/>
        <span v-if="book.asks.length>0"><span class="color-success">asks: {{numeralFormat(asks(), '0,0[.]0')}} {{exchange.base}}</span> </span><br/>
        <span v-if="book.bids.length>0"><span class="color-danger">bids: {{numeralFormat(bids(), '0,0[.]0')}} {{exchange.base}}</span> </span><br/>
        <!-- <h6><span>asks: {{exchange.book.asks.length}}</span></h6>
        <h6><span>bids: {{exchange.book.bids.length}}</span></h6> -->
    </div>
    
        
</template>

<script>
import { debounce } from 'lodash'
import decimal from 'decimal.js'

export default {
    name: 'Book',
    props: ['exchange_key', 'items', 'col', 'addresses'],
    data() {
        return {
            debouncedBook: null,
            bookSkipCount: 0,
            book: {
                bids: [],
                asks: []
            }
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
        console.log('debouncedBook: ' + this.exchange_key)
    },
    beforeUnmount() {
        if (this.debouncedBook === null) { return }
        this.debouncedBook.cancel()
    },
    mounted() {
        console.log('mounted.... dep', this.exchange_key)
    },
    computed: {
        exchange() {
            return this.$store.getters.getExchangeBook(this.exchange_key)
        },
        offers() {
            // console.log('offers', this.$store.getters.getExchangeBook(this.exchange_key).book)
            return this.$store.getters.getExchangeBook(this.exchange_key).book
        }
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
        },  
    },
    methods: {
        spread() {
            if (this.book.asks.length == 0 || this.book.bids.length == 0) { return 0 }
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
            if (this.book.bids.length == 0) { return 0 }
            // return new decimal(this.book.bids[0].limit_price).toFixed(8)
            return (new decimal(this.book.bids[0].limit_price).plus(this.book.asks[this.book.asks.length-1].limit_price)).div('2')
        },
        format(value) {
            if ((value*1) > 10) {
                return this.numeralFormat(value, '0,0[.]00')
            }
            return this.numeralFormat(value, '0,0[.]0000000000')
        },
        bid_depth(index2) {
            let sum = 0
            for (let index = 0; index <= index2; index++) {
                sum += this.book.bids[index].amount *1
            }
            const total = (this.bids() > this.asks()) ? this.bids() : this.asks() //this.bids() //
            
            return sum / total
        },
        ask_depth(index2) {
            let sum = 0
            for (let index = this.book.asks.length -1; index >= index2; index--) {
                sum += this.book.asks[index].amount *1
            }

            const total = (this.bids() > this.asks()) ? this.bids() : this.asks() //this.asks() //
            
            return sum / total
        },
        bids() {
            let total = 0
            for (let index = 0; index < this.book.bids.length; index++) {
                total += this.book.bids[index].amount *1
            }
            return total
        },
        asks() {
            let total = 0
            for (let index = 0; index < this.book.asks.length; index++) {
                total += this.book.asks[index].amount * 1 
            }
            return total
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
}

.bids .depth {
    position: absolute;
    background-color: rgba(255, 26, 139, 0.1);
    transform-origin: left;
    top: 0;
    bottom: 0;
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