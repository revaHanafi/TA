import mongoose from "mongoose";

const Schema = mongoose.Schema;

const GuruSchema = new Schema({
    nama: { type: String, 
    required: true 
    },
    NIG: { type: String, 
        unique: true, 
        required: true 
    }
    
}, {
    timestamps: true
});

const Guru = mongoose.model("Guru", GuruSchema);

export default Guru;