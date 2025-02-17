import express from "express";
const app= express();
import {routeController} from "./function.js"



app.use(express.json({ limit: '16kb' }))
app.use(express.urlencoded({ extended: true, limit: '16kb' }))
app.use(express.static('public'))

app.get("/getpath",routeController)

export default app;