var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { pool } from './db';
import { DatabaseStorage } from './storage';
function testDatabaseStorage() {
    return __awaiter(this, void 0, void 0, function () {
        var storage, snippets, tags, languages, collections, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Testing DatabaseStorage...');
                    storage = new DatabaseStorage();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 9]);
                    console.log('Testing getSnippets()...');
                    return [4 /*yield*/, storage.getSnippets()];
                case 2:
                    snippets = _a.sent();
                    console.log("Found ".concat(snippets.length, " snippets"));
                    console.log('Testing getTags()...');
                    return [4 /*yield*/, storage.getTags()];
                case 3:
                    tags = _a.sent();
                    console.log("Found ".concat(tags.length, " tags: ").concat(tags.join(', ')));
                    console.log('Testing getLanguages()...');
                    return [4 /*yield*/, storage.getLanguages()];
                case 4:
                    languages = _a.sent();
                    console.log("Found ".concat(languages.length, " languages: ").concat(languages.join(', ')));
                    console.log('Testing getCollections()...');
                    return [4 /*yield*/, storage.getCollections()];
                case 5:
                    collections = _a.sent();
                    console.log("Found ".concat(collections.length, " collections"));
                    return [3 /*break*/, 9];
                case 6:
                    error_1 = _a.sent();
                    console.error('Error testing DatabaseStorage:', error_1);
                    return [3 /*break*/, 9];
                case 7: 
                // Close the database connection pool
                return [4 /*yield*/, pool.end()];
                case 8:
                    // Close the database connection pool
                    _a.sent();
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testDatabaseStorage();
