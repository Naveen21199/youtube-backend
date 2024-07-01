// require('dotenv').config({path : './env'})
import dotenv from 'dotenv'
import connetDb from './db/index.js';
import { app } from './app.js';

dotenv.config({
    path: './.env'
})




connetDb().then(() => {
    app.listen(process.env.PORT || 8080, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
}).catch((err) => {
    console.log(`Mongodb connetion failed !!`, err)
})






/*
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("Error", error)
            throw error
        })
        app.listen(process.env.PORT, () => {
            console.log(`App listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.log("ERRR", error);
        throw err
    }
})() 
*/
