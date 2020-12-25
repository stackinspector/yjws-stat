import { writelnSync } from 'baseutil/writeln.ts'
import type { Dict, Ports, Output } from 'baseutil/fetchlot.ts'
import { worker } from 'baseutil/fetchlot.ts'

const ID = 16378017

const ports: Ports<number> = new Map([
    ['info', {
        url: () => `https://api.bilibili.com/x/tag/info?tag_id=${ID}`,
        valid: [
            (resp) => resp.code as number === 0,
            (resp) => (resp.data as Dict).tag_id as number === ID,
        ],
        proc: (resp) => {
            const count = (resp.data as Dict).count as Dict
            return {
                use: count.use as number,
                follow: count.atten as number,
            }
        },
    }],
    ['extd', {
        url: () => `https://api.vc.bilibili.com/topic_svr/v1/topic_svr/get_active_users?topic_id=${ID}`,
        valid: [
            (resp) => resp.code as number === 0,
            (resp) => (resp.data as Dict).topic_id as number === ID,
        ],
        proc: (resp, input) => {
            const data = resp.data as Dict
            return {
                view: data.view_count as number,
                discuss: data.discuss_count as number,
                active: new Date(input).getMinutes() % 10 === 0 ? (data.active_users as Dict[]).map((s) => ({
                    uid: (s.user_info as Dict).uid as number,
                    score: s.score as number,
                })) : void 0,
            }
        },
    }],
])

const output: Output = (type, message) => {
    writelnSync(JSON.stringify(message), './' + type)
    console.log(type.toUpperCase(), message)
}

setInterval((async () => {
    const time = new Date()
    if (time.getSeconds() === 0) await worker<number>(Number(new Date()), ports, output)
}), 1000)

