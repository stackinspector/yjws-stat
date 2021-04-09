// deno-lint-ignore-file camelcase

import { writelnSync } from 'baseutil/writeln.ts'
import type { Ports, Output } from 'baseutil/fetchlot.ts'
import { worker } from 'baseutil/fetchlot.ts'

interface Info {
    tag_id: number
    count: {
        use: number
        atten: number
    }
}

interface Extd {
    topic_id: number
    view_count: number
    discuss_count: number
    active_users: {
        user_info: {
            uid: number
        }
        score: number
    }[]
}

const ID = Number(Deno.args[0])

const ports: Ports<number> = new Map([
    ['info', {
        url: () => `https://api.bilibili.com/x/tag/info?tag_id=${ID}`,
        valid: [
            (resp) => resp.code as number === 0,
            (resp) => (resp.data as Info).tag_id === ID,
        ],
        proc: (resp) => {
            const count = (resp.data as Info).count
            return {
                use: count.use,
                follow: count.atten,
            }
        },
    }],
    ['extd', {
        url: () => `https://api.vc.bilibili.com/topic_svr/v1/topic_svr/get_active_users?topic_id=${ID}`,
        valid: [
            (resp) => resp.code as number === 0,
            (resp) => (resp.data as Extd).topic_id === ID,
        ],
        proc: (resp, input) => {
            const data = resp.data as Extd
            return {
                view: data.view_count,
                discuss: data.discuss_count,
                active: new Date(input).getMinutes() % 10 === 0 ? data.active_users.map((s) => ({
                    uid: s.user_info.uid,
                    score: s.score,
                })) : void 0,
            }
        },
    }],
])

const output: Output = (type, message) => {
    writelnSync(JSON.stringify(message), `./${ID}_${type}`)
    console.log(type.toUpperCase(), message)
}

setInterval((async () => {
    const time = new Date()
    if (time.getSeconds() === 0) await worker<number>(Number(new Date()), ports, output)
}), 1000)

