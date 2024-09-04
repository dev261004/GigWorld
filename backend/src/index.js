
import connectDB from "./db/db.js";
import dotenv from "dotenv";
import {app} from "./app.js"

dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
     console.log(`Server is running at port :${process.env.PORT}`);
    })
    app.on("error",(error)=>{
        console.log("ERROR  HAPPENED  IN SERVER :( ",error);
        throw error
    })
})
.catch((err)=>
{
    console.log("MongoDb Connection Failed :( ",err);
})
