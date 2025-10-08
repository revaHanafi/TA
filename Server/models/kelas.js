import mongoose from "mongoose";

const Schema = mongoose.Schema;

const KelasSchema = new Schema({
    kelas: {
        type: String, 
        required: true},
    sub_kelas: { type :String},
    
}, {
    timestamps: true
});

const Kelas = mongoose.model("Kelas", KelasSchema);

//module.exports = Kelas;
export default Kelas;