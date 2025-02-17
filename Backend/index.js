import 'dotenv/config'
import connectDb from './db/dbConnecter.js'
import app from './app.js'

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`SERVER IS RUNNING AT PORT:  ${process.env.PORT} `)
    })
  })
  .catch(err => {
    console.log(`DATABASE CONNECTION FAILED :`, err)
  })