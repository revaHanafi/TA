import mongoose from "mongoose";

const Schema = mongoose.Schema;

const AbsenSchema = new Schema({
    NIS: { type: String, 
        required: true 
    },
    id_kelas: { type: mongoose.Schema.Types.ObjectId, 
        ref: 'Kelas', 
        required: true 
    },
    tanggal: { type: Date, 
        required: true 
    },
    status: { type: String, 
        enum: ['Hadir', 'Tidak Hadir', 'Izin', 'Sakit'], 
        required: true }
    
}, {
    timestamps: true
});

const Absen = mongoose.model("Absen", AbsenSchema);

export default Absen;