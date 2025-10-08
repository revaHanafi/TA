import mongoose from "mongoose";

const Schema = mongoose.Schema;

const MuridSchema = new Schema({
    nama: {
        type: String, 
        required: true,},

    NIS: {
        type: String, 
        required: true,
        unique: true},

    NISN: {
        type: String, 
        required: true, 
        unique:true,
    id_kelas:{
        type : Schema.Types.ObjectId,
        ref: "kelas"
    }
}}, {
    timestamps: true
});

const Murid = mongoose.model("Murid", MuridSchema);
//module.exports = Murid;
export default Murid;