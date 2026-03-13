// const mongoose = require("mongoose")

// async function connectToDB() {
//     try {

//         mongoose.connect(process.env.MONGO_URI)
//         console.log("connected to database")
//     }
//     catch (error) {
//         console.log(error)
//     }

// }
// module.exports = connectToDB

const mongoose = require("mongoose")

async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to database")
    } catch (error) {
        console.log("Database Error:", error)
    }
}

module.exports = connectToDB