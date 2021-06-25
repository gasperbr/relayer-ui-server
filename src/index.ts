import express, {NextFunction, Request, Response }from "express";
import dotenv from "dotenv";
import Mongoose from "mongoose";
import { executedOrderModel, IExecutedOrderModel, IOrderCounterModel, orderCounterModel } from "./models";
import fs from "fs";

dotenv.config();

const app = express();
const port = 80;

Mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useFindAndModify: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
}).then(() => console.log('Connected to the database')).catch(console.error);

const ExecutedOrderModel = Mongoose.model<IExecutedOrderModel>("executedOrderModel", executedOrderModel);
const OrderCounterModel = Mongoose.model<IOrderCounterModel>("orderOrderModel", orderCounterModel);


app.get("/api/executed-orders", (req: Request, res: Response, next: NextFunction) => {

  const from = +req.query.from;
  const to = +req.query.to;
  const chain = +req.query.chainId;

  if (!from || !to || !chain) next(`Supply "from", "to" and "chain" query params`)

  ExecutedOrderModel.find({
    createdAt: {
      $gte: new Date(from),
      $lt: new Date(to)
    }
  }).then(data => {
    res.send(data);
  }).catch(console.log);

});

app.get("/api/received-orders-count", (req: Request, res: Response, next: NextFunction) => {

  const from = +req.query.from;
  const to = +req.query.to;
  const chain = +req.query.chainId;

  if (!from || !to || !chain) next(`Supply "from", "to" and "chain" query params`)

  OrderCounterModel.find({
    date: {
      $gte: new Date(from),
      $lt: new Date(to)
    }
  }).then(data => {
    res.send(data);
  }).catch(console.log);

});

app.get("/api/logs", (req: Request, res: Response, next: NextFunction) => {

  const chain = +req.query.chainId;

  const name = getChainName(+chain);

  if (!name) next(`Supply a valid "chain" query param`);

  fs.readFile(`../${name}/limit-order-relayer/out.log`, 'utf8', (err, data) => {
    if (err) console.log(err);

    fs.readFile(`../${name}/limit-order-relayer/error.log`, 'utf8', (err2, data2) => {
      if (err2) console.log(err2);
      res.send({
        out: data,
        error: data2
      });
    })
  })

});

app.listen( port, () => {
  console.log( `server started at http://localhost:${ port }` );
} );

function getChainName(chainId: number) {
  if (chainId === 137) {
    return "polygon";
  }
}