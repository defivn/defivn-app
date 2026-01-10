import { SwapExactInSingle } from '@uniswap/v4-sdk'
import { USDC_TOKEN, ETH_TOKEN } from '@/lib/constants'
import { parseUnits } from "viem"

export const CurrentConfig: SwapExactInSingle = {
    poolKey: {
        currency0: ETH_TOKEN.address,
        currency1: USDC_TOKEN.address,
        fee: 500, // 0.05%
        tickSpacing: 10,
        hooks: "0x0000000000000000000000000000000000000000",
    },
    zeroForOne: true,
    amountIn: parseUnits('1', ETH_TOKEN.decimals).toString(), 
    amountOutMinimum: "0",
    hookData: '0x00'
}