require("dotenv").config()
const app = require("./src/app")
const invokeGeminiAi = require("./src/services/ai.service")

const connectToDB = require("./src/config/database")

connectToDB()



app.listen(3000, () => {
    console.log("Server is running on port 3000")
})


