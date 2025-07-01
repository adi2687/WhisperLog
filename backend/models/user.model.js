import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: ""
    },
    coverPicture: {
        type: String,
        default: ""
    },

    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    bio: {
        type: String,
        default: ""
    },
    birthday: {
        type: Date,
        default: null
    },
    location: {
        type: String,
        default: ""
    },
    publicKey: {
        type: String,
        default: ""
    },
    privateKey: {
        type: String,
        default: ""
    },
    status:{
        type: String,
        default: "offline"
    },
    hobbies: {
        type: [{
            type: String,
            enum: ['movies', 'music', 'sports', 'reading', 'gaming', 'travel', 'photography', 'cooking', 'other']
        }],
        default: []
    },
    moviePreferences: {
        type: [{
            type: String,
            enum: ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Documentary', 'Animation', 'Fantasy', 'Adventure', 'Crime', 'Mystery', 'Western']
        }],
        default: []
    },
    musicPreferences: {
        type: [{
            type: String,
            enum: ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Jazz', 'Classical', 'Country', 'Metal', 'Indie', 'Folk', 'Reggae', 'Blues', 'K-Pop']
        }],
        default: []
    },
    Joined: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

const UserModel = mongoose.model("User", userSchema)

export default UserModel
