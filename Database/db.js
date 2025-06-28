import mongoose from "mongoose";
const connectToDb=async()=> {
try{
    await mongoose.connect("mongodb://localhost:27017/medistore",)
    console.log("monogdb connection successfully");
}
    catch(error)
    {
        console.error("mongodb is not connected");
    }
    }
export default connectToDb;