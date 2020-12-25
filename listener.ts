import { writelnSync } from 'baseutil/writeln.ts'
import type { Ports, Output } from 'baseutil/fetchlot.ts'
import { worker } from 'baseutil/fetchlot.ts'

const ID = 16378017

const ports: Ports<number> = new Map([
    ['info', {
        url: () => `https://api.bilibili.com/x/tag/info?tag_id=${ID}`,
        valid: [
            (resp) => resp.code as number === 0,
            (resp) => resp.data.tag_id as number === ID,
        ],
        proc: (resp) => ({
            use: resp.data.count.use as number,
            follow: resp.data.count.atten as number,
        }),
    }],
    ['extd', {
        url: () => `https://api.vc.bilibili.com/topic_svr/v1/topic_svr/get_active_users?topic_id=${ID}`,
        valid: [
            (resp) => resp.code as number === 0,
            (resp) => resp.data.topic_id as number === ID,
        ],
        proc: (resp, input) => ({
            view: resp.data.view_count as number,
            discuss: resp.data.discuss_count as number,
            active: new Date(input).getMinutes() % 10 === 0 ? (resp.data.active_users as any[]).map((s) => ({
                uid: s.user_info.uid as number,
                score: s.score as number,
            })) : void 0,
        }),
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

