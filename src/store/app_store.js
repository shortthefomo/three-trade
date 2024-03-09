'use strict'
import { XrplClient } from 'xrpl-client'

 /* eslint-disable */ 
export const AppStore = {
    state: () => ({
        version: '0.0.1',
        xumm: {
            tokenData: {
                nodetype: 'MAINNET'
            }
        },
        network: '',
        client: null,
        servers: [],
        account: '',
        signed_in: false,
        books: {},
        paths: {},
        history: [],
        trustlines: []
    }),
    actions: {
        storageInit({commit}, force) {
            commit('INIT', force)
        },
        clearStorage({commit}, force) {
            commit('CLEAR', force)
        },
        xummTokenData({commit}, data) {
            commit('TOKEN_DATA', data)
        },
        clientConnect({commit}, force) {
            commit('CONNECT', force)
        },
        setClientServers({commit}, servers) {
            commit('SERVERS', servers)
        },
        setAccount({commit}, account) {
            commit('ACCOUNT', account)
        },
        setTrustLines({commit}, trustlines) {
            commit('TRUSTLINES', trustlines)
        },
        setNetwork({commit}, network) {
            commit('NETWORK', network)
        },
        setSignIn({commit}, signed_in) {
            commit('SIGNIN', signed_in)
        },
        clearBooks({commit}) {
            commit('BOOKS_CLEAR')
        },
        listenBook({commit}, data) {
            commit('BOOKS', data)
        },
        updateBook({commit}, data) {
            commit('BOOK_UPDATE', data)
        },
        updatePath({commit}, data) {
            commit('PATH_UPDATE', data)
        },
        pushHistoryExchange({commit}, payload) {
            commit('HISTORY_EXCHANGE', payload)
        },
        clearHistoryExchange({commit}) {
            commit('HISTORY_EXCHANGE_CLEAR')
        },
    },
    mutations: {
        INIT(state, force = false) {
            if (force === false) { return }
            if (localStorage.getItem('account')) {
                state.account = JSON.parse(localStorage.getItem('account'))
                console.log('loaded account from state', state.account)
            }
            if (localStorage.getItem('trustlines')) {
                state.trustlines = JSON.parse(localStorage.getItem('trustlines'))
                console.log('loaded trustlines from state', state.trustlines)
            }
            if (localStorage.getItem('network')) {
                state.network = JSON.parse(localStorage.getItem('network'))
                console.log('loaded network from state', state.network)
            }
            if (localStorage.getItem('tokenData'))
                state.xumm.tokenData = JSON.parse(localStorage.getItem('tokenData'))
            if (localStorage.getItem('signed_in'))
                state.signed_in = JSON.parse(localStorage.getItem('signed_in'))
            console.log('state loaded from storage: ', state)
        },
        CLEAR(state, force = false) {
            if (force === false) { return }
            localStorage.clear()
        },
        TOKEN_DATA(state, data) {
            state.xumm.tokenData = data
            localStorage.setItem('tokenData', JSON.stringify(data))
        },
        SIGNIN(state, signed_in) {
            console.log('signed in set in state', signed_in)
            state.signed_in = signed_in
            localStorage.setItem('signed_in', JSON.stringify(signed_in))
        },
        CONNECT(state, force) {
            if (state.servers.length < 0) { return }
            if (force || state.client === null) {
                state.client = new XrplClient(state.servers)
            }
        },
        SERVERS(state, servers) {
            state.servers = servers
            if (state.client !== null) {
                state.client.close()
            }
            state.client = new XrplClient(state.servers)
        },
        ACCOUNT(state, account) {
            state.account = account
            localStorage.setItem('account', JSON.stringify(account))
        },
        TRUSTLINES(state, trustlines) {
            state.trustlines = trustlines
            localStorage.setItem('trustlines', JSON.stringify(trustlines))
        },
        NETWORK(state, network) {
            state.network = network
            localStorage.setItem('network', JSON.stringify(network))
        },
        BOOKS(state, data) {
            const key = data.base + data.base_issuer + data.quote + data.quote_issuer + '-' + data.network
            if (state.books[key] === undefined) {
                state.books[key] = {
                    name: data.name,
                    network: data.network,
                    type: data.type,
                    market: data.market,
                    base: data.base,
                    quote: data.quote,
                    base_issuer: data.base_issuer,
                    quote_issuer: data.quote_issuer,
                    book: {
                        bids: [],
                        asks: []
                    }
                }
            } 
            // localStorage.setItem('books', JSON.stringify(books))
        },
        BOOKS_CLEAR(state) {
            state.books = {}
        },
        BOOK_UPDATE(state, data) {
            if (state.books[data.key] !== undefined) {
                const asks = Object.values(data.book.asks).sort((a,b) => (a.limit_price*1 > b.limit_price*1) ? 1 : ((b.limit_price*1 > a.limit_price*1) ? -1 : 0))
                const bids = Object.values(data.book.bids).sort((a,b) => (a.limit_price*1 < b.limit_price*1) ? 1 : ((b.limit_price*1 < a.limit_price*1) ? -1 : 0))

                const values = {
                    bids: bids,
                    asks: asks.reverse()
                }

                state.books[data.key].book = values
            }
        },
        PATH_UPDATE(state, data) {
            // console.log('seeetttt', data.key)
            state.paths[data.key] = data
        },
        HISTORY_EXCHANGE(state, payload) {
            const order = payload.order
            const key = payload.key

            const copyAll = [...state.history]
            copyAll.unshift(order)
            while (copyAll.length > 100) {
                copyAll.pop()
            }
            state.history = copyAll
        },
        HISTORY_EXCHANGE_CLEAR(state) {
            state.history = []
        }
    },
    getters: {
        getVersion: state => {
            return state.version
        },
        getXummTokenData: state => {
            return state.xumm.tokenData
        },
        getClient: state => {
            return state.client
        },
        getClientServers: state => {
            return state.servers
        },
        getAccount: state => {
            return state.account
        },
        getTrustlines: state => {
            return state.trustlines
        },
        getNetwork: state => {
            return state.network
        },
        getSignedIn: state => {
            return state.signed_in
        },
        getExchangeBook: (state) => (key) => {
            if (key in state.books) {
                return state.books[key]
            }
            return {
                bids: [],
                asks: []
            }
        },
        getBooks: state => {
            return state.books
        },
        getPath: (state) => (key) => {
            // console.log('ggggeeettt', key)
            // console.log('ggggeeettt', state.paths[key])
            if (key in state.paths) {
                return state.paths[key]
            }
            return undefined
        },
        getHistoryAll: (state) => {
            return state.history
        },
        // getHistoryExchange: (state) => (key) => {
        //     if (key in state.exchange) {
        //         return state.exchange[key].history
        //     }
        //     return []
        // },
    }
}