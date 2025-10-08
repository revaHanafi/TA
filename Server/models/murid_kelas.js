import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const MuridKelasSchema = new Schema({
    id_murid: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Murid', 
        required: true 
    },
    id_kelas: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Kelas', 
        required: true 
    }
}, {
    timestamps: true,
    indexes: [{ 
        unique: true, 
        fields: ['id_murid', 'id_kelas'] 
    }]
});
const MuridKelas = mongoose.model("MuridKelas", MuridKelasSchema);
export default MuridKelas;
