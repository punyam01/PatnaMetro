import mongoose from 'mongoose'

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DB_URL}/${process.env.DB_NAME}`
    )
    console.log(
      mongoose.connection.db.databaseName
    )
  } catch (error) {
    console.log(`DATABASE CONNECTION FAILED!!:`, error)
  }
}

export default connectDb