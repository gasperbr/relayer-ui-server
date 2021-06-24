import { ILimitOrderData } from "limitorderv2-sdk";
import Mongoose from "mongoose";

const Schema = Mongoose.Schema;

export const executedOrderModel = new Schema({
  digest: String,
  order: {
    maker: String,
    tokenIn: String,
    tokenOut: String,
    tokenInDecimals: Number,
    tokenOutDecimals: Number,
    amountIn: String,
    amountOut: String,
    recipient: String,
    startTime: Number,
    endTime: Number,
    stopPrice: String,
    oracleAddress: String,
    oracleData: String,
    v: Number,
    r: String,
    s: String,
    chainId: Number
  },
  fillAmount: String,
  txHash: String,
}, { timestamps: true });

export const orderCounterModel = new Schema({
  date: Date,
  counter: Number
})

executedOrderModel.set("collection", `executedorders_137`);
orderCounterModel.set("collection", `orderCounter_137`);

export interface IExecutedOrder {
  order: ILimitOrderData,
  digest: string,
  txHash: string,
  fillAmount: string
}

export interface IExecutedOrderModel extends IExecutedOrder, Document { };

export interface IOrderCounter {
  date: Date,
  counter: number
}

export interface IOrderCounterModel extends IOrderCounter, Document { };


