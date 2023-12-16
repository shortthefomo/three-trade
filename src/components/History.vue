<template>
    <!-- <h2 class="display-8 fw-bold">Trade History</h2> -->
    <div v-if="history.length>0" class="p-0 mb-0 dark-background trade-history rounded-3">
        <div class="p-2 container-fluid">
            <table class="table fs-7">
                <thead class="table-dark">
                    <tr>
                        <th>limit price</th>
                        <th>quantity</th>
                        <th>value</th>
                        <th v-if="addresses">taker</th>
                        <th v-if="addresses">maker</th>
                        <th>time</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- eslint-disable-next-line -->
                    <tr v-for="row in history.slice(0, items)">
                        <!-- <td :class="colorTrade(row['color'])" scope="row">{{row}}</td> -->
                        <td class="dark-background" scope="row">{{numeralFormat(row['limit_price'], '0,0[.]00000000')}} {{row['quote']}}</td>
                        <td class="dark-background" scope="row">{{numeralFormat(row['amount'], '0,0[.]00000000')}}</td>
                        <td class="dark-background" scope="row">{{numeralFormat(row['volume'], '0,0[.]00000000')}} {{row['base']}}</td> 
                        <td class="dark-background" v-if="addresses" scope="row"><a :href="`https://explorer.panicbot.xyz/${row['taker']}/offers?network=mainnet`" target="_blank">{{row['taker']}}</a></td> 
                        <td class="dark-background" v-if="addresses" scope="row"><a :href="`https://explorer.panicbot.xyz/${row['maker']}/offers?network=mainnet`" target="_blank">{{row['maker']}}</a></td> 
                        <td class="dark-background" scope="row">{{this.adjustTime(row['timestamp'])}}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <p>Traded: {{ numeralFormat(this.xrp_total, '0,0[.]00000000') }} XRP</p>
</template>


<script>
    import {debounce} from 'lodash'

    export default {
        name: "TradeHistory",
        props: ['addresses'],
        data() {
            return {
                items: 100,
                lastupdate: new Date().getTime(),
                isLoading: true,
                debouncedHistory: null,
                historySkipCount: 0,
                history: [],
                show: false,
                xrp_total: 0,
                last_hash: ''
            }
        },
        created() {
            if (this.debouncedHistory != null) { return }
            this.debouncedHistory = debounce(data => {
                const result = [...data]
                this.historySkipCount = 0

                // only update the history if they are different!
                if (JSON.stringify(result) === JSON.stringify(this.history)) { return }
                this.history = result
                
            }, 50)
            console.log('debouncedHistory')
        },
        beforeUnmount() {
            if (this.debouncedHistory == null) { return }
            this.debouncedHistory.cancel()
        },
        mounted() {
            console.log('in history render')
            if (this.isLoading) { 
                this.isLoading = false
            }
        },
        computed: {
            historyExchange() {
                const history = this.$store.getters.getHistoryAll
                for (let index = 0; index < history.length; index++) {
                    const element = history[index]

                    if (element.hash === this.last_hash) { break }
                    if (element.base === 'XRP') {
                        // console.log('base', element)
                        this.xrp_total += element.volume
                    }

                    if (element.quote === 'XRP') {
                        // console.log('quote', element)
                        this.xrp_total += element.amount
                    }
                }
                if (history[0] !== undefined) {
                    this.last_hash = history[0].hash
                }
                return this.$store.getters.getHistoryAll
            }
        },
        watch: {
            historyExchange(newValue) {
                this.historySkipCount++
                if (this.historySkipCount > 20) {
                    this.history = [...newValue]
                    this.historySkipCount = 0
                }
                else {
                    this.debouncedHistory(newValue)
                }
            }
        },
        methods: {
            adjustTime(time) {
                const offset = (-1) * new Date(time).getTimezoneOffset() * 60000
                const stamp = Math.round(new Date((time *1000 )+ offset).getTime() / 1000)
                return new Date(stamp).toString().split(' ')[4]
            }
        },
    }
</script>

<style scoped>
.trade-history {
    display: block;
    overflow-y: scroll;
    height: 520px;
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
.color-warning {
    color: #ffc107;
}
.color-white {
    color: #FFFFFF;
}

.dark-background {
    color: #FFFFFF;
    background-color: rgb(31, 31, 31);
}

table a {
    color: #FFFFFF;
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