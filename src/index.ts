import express, {NextFunction, Request, Response }from "express";
import dotenv from "dotenv";
import Mongoose from "mongoose";
import { executedOrderModel, IExecutedOrderModel, IOrderCounterModel, orderCounterModel } from "./models";
import cors from 'cors';
import axios from 'axios';
import https from 'https';
import http from 'http';
import fs from 'fs';

dotenv.config();

const app = express();
const port = 443;


const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

const credentials = {
  key: fs.readFileSync('./cert/key.pem'),
  cert: fs.readFileSync('./cert/cert.pem'),
};

Mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useFindAndModify: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
}).then(() => console.log('Connected to the database')).catch(console.error);

const ExecutedOrderModel = Mongoose.model<IExecutedOrderModel>("executedOrderModel", executedOrderModel);
const OrderCounterModel = Mongoose.model<IOrderCounterModel>("orderOrderModel", orderCounterModel);

app.use('/api/status', (req, res, next) => {
  res.send('looks good')
})

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
  }).then(async (orders: any[]) => {

    const updateArr: number[] = [];

    orders.forEach((order, i) => {
      if (order.status !== 0 && order.status !== 1) {
        if (chain === 137) {
          updateArr.push(i);
        }
      }
    })

    // intentionally make the code synchronus to avoid etherscan rate limit of 5/1 sec request

    try {

      for (const i of updateArr) {

        const response = await axios(`https://api.polygonscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${orders[i].txHash}&apikey=${process.env.POLYGONSCAN_API_KEY}`);
        await new Promise(r => setTimeout(() => r(undefined), 201)); // rate limit buffer

        if (response.data.status === '1' || response.data.status === '0') {
          ExecutedOrderModel.updateOne({ txHash: orders[i].txHash }, { status: +response.data.result.status }).exec().then();
        }

      }

    } catch (e) {
      console.log(`ERROR polygonscan: ${e}`);
    }

    res.send(orders);

  }).catch(console.log);

});

app.get("/api/received-orders-count", (req: Request, res: Response, next: NextFunction) => {

  const from = +req.query.from;
  const to = +req.query.to;
  const chain = +req.query.chainId;

  if (!from || !to || !chain) next(`Supply "from", "to" and "chain" query params`);

  OrderCounterModel.find({
    timestamp: {
      $gte: from,
      $lt: to
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

/* app.listen(port, () => {
  console.log(`server started at port ${port}`);
}); */

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

function getChainName(chainId: number) {
  if (chainId === 137) {
    return "polygon";
  }
}