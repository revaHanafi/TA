import mongoose from "mongoose";
import Guru from "./guru.js";

const Schema = mongoose.Schema;

const loginSchema = new Schema({
     NIG: {
        type: String,
        ref: 'Guru',
        unique: true
    },
    Password:{
        type: String,
        require: true
    },

    guru: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guru',
        require: true
    }
},{
    timestamps: true
});
const Login = mongoose.model("Login", loginSchema);
export default Login;