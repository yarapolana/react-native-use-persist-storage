"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const createAsyncStorage_1 = __importDefault(require("./createAsyncStorage"));
const createSensitiveStorage_1 = __importDefault(require("./createSensitiveStorage"));
var createMigrate_1 = require("./createMigrate");
exports.createMigrate = createMigrate_1.default;
const defaultOptions = {
    version: 0,
    persist: true,
    migrate: null,
    sensitive: false,
};
const usePersistStorage = (key, initialValue, { version = defaultOptions.version, persist = defaultOptions.persist, migrate = defaultOptions.migrate, sensitive = defaultOptions.sensitive, } = defaultOptions) => {
    const isMounted = react_1.useRef(false);
    const currentVersion = react_1.useRef(version);
    const [state, setState] = react_1.useState(initialValue);
    const [restored, setRestored] = react_1.useState(false);
    const Storage = react_1.useMemo(() => sensitive
        ? createSensitiveStorage_1.default(sensitive)
        : createAsyncStorage_1.default(), ['unchange']);
    const logPrefix = sensitive ? '(sensitive)' : '';
    react_1.useEffect(() => {
        if (persist) {
            const setStateToStorage = (forceValue) => __awaiter(this, void 0, void 0, function* () {
                const value = forceValue || {
                    _currentVersion: currentVersion.current,
                    value: state,
                };
                try {
                    const serializedValue = JSON.stringify(value);
                    yield Storage.setItem(key, serializedValue);
                    console.debug(`${logPrefix}[PersistStorage]: set ${key}: `, value);
                }
                catch (err) {
                    console.error(err);
                }
            });
            const restoreStateFromStorage = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    const storageValue = yield Storage.getItem(key);
                    if (storageValue) {
                        let parsedValue = JSON.parse(storageValue || 'null');
                        if (parsedValue && parsedValue._currentVersion === undefined) {
                            parsedValue = {
                                _currentVersion: 0,
                                value: parsedValue,
                            };
                        }
                        if (migrate) {
                            parsedValue = migrate({
                                key,
                                state: parsedValue,
                                version: currentVersion.current,
                            });
                            yield setStateToStorage(parsedValue);
                            currentVersion.current = parsedValue._currentVersion;
                        }
                        setState(parsedValue.value);
                        console.debug(`${logPrefix}[PersistStorage]: restore ${key}: `, parsedValue);
                    }
                    else {
                        setStateToStorage();
                    }
                }
                catch (err) {
                    console.error(err);
                }
                setRestored(true);
            });
            if (!isMounted.current) {
                restoreStateFromStorage();
                isMounted.current = true;
            }
            else {
                setStateToStorage();
            }
        }
        else {
            Storage.removeItem(key);
            setRestored(true);
            console.debug(`${logPrefix}[PersistStorage]: remove ${key}`);
        }
    }, [state]);
    return [state, setState, restored];
};
exports.default = usePersistStorage;