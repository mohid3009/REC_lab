"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("./src/models/User"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Connecting to MongoDB...');
        yield mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pdf-form-system');
        console.log('Connected.');
        console.log('Creating test user...');
        const user = new User_1.default({
            email: 'test-script@gmail.com',
            password: '123456',
            name: 'Test Script User',
            role: 'Student',
            department: 'CS'
        });
        console.log('Saving user...');
        yield user.save();
        console.log('User saved successfully');
        console.log('User:', user);
        console.log('Finding user...');
        const found = yield User_1.default.findOne({ email: 'test-script@gmail.com' });
        console.log('Found user:', found === null || found === void 0 ? void 0 : found.email);
        yield mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('Test script error:', error);
    }
});
run();
