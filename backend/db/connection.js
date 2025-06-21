import mongoose from "mongoose";

const connect = async (mongoUrl) => {
        await mongoose.connect(mongoUrl);
        // console.log(mongoUrl)
        console.log('Connected to the database successfully');
};

export default connect;
