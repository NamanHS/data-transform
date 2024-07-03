interface MapItem {
    [key: string]: string | string[] | Record<string, string | string[]>;
}

interface Method {
    run: string | Function;
    on: string;
}

interface Map {
    list?: string;
    item?: MapItem;
    remove?: string[];
    operate?: Method[];
    defaults?: Record<string, any>;
    each?: Function;
}

class DataTransform {
    static defaultOrNull(key: string, map: Map): any {
        return key && map.defaults ? map.defaults[key] : undefined;
    }

    static getValue(obj: any, key: string, newKey: string | undefined, data: any, map: Map): any {
        if (typeof obj === 'undefined') return;
        if (!key) return obj;
        let value: any = obj || data;
        const keys: string[] = key.split('.');
        for (let i = 0; i < keys.length; i++) {
            value = value ? value[keys[i]] : undefined;
            if (value === undefined) break;
        }
        return value !== undefined ? value : this.defaultOrNull(newKey || '', map);
    }

    static setValue(obj: any, key: string, newValue: any): void {
        if (typeof obj === 'undefined' || !key) return;
        const keys: string[] = key.split('.');
        let target: any = obj;
        for (let i = 0; i < keys.length; i++) {
            if (i === keys.length - 1) {
                target[keys[i]] = newValue;
            } else {
                target = target[keys[i]] = target[keys[i]] || {};
            }
        }
    }

    static getList(data: any, map: Map): any {
        return this.getValue(data, map.list || '', undefined, data, map);
    }

    static transform(data: any, map: Map, context: any): any {
        const useList: boolean = !!map.list;
        const value: any = useList ? this.getValue(data, map.list || '', undefined, data, map) : (Array.isArray(data) ? data : [data]);
        if (!value.length) return [];

        const list: any = useList ? this.getList(data, map) : value;
        let normalized: any = map.item ? this.mapItems(list, map.item, data, map) : list;
        normalized = this.operate(normalized, context, data, map);
        normalized = this.each(normalized, context, data, map);
        normalized = this.removeAll(normalized, data, map);

        return useList || !Array.isArray(data) ? normalized : normalized[0];
    }

    static async transformAsync(data: any, map: Map, context: any): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.transform(data, map, context));
            } catch (err) {
                reject(err);
            }
        });
    }

    static removeAll(data: any[], _: undefined, map: Map): any[] {
        if (Array.isArray(map.remove)) {
            for (let i = 0; i < data.length; i++) {
                this.remove(data[i], undefined, map);
            }
        }
        return data;
    }

    static remove(item: any, _: undefined, map: Map): any {
        for (let i = 0; i < map.remove!.length; i++) {
            delete item[map.remove![i]];
        }
        return item;
    }

    static operate(data: any[], context: any, dataParam: any, map: Map): any[] {
        if (map.operate) {
            for (let i = 0; i < map.operate.length; i++) {
                const method: Method = map.operate[i];
                const fn: Function = typeof method.run === 'string' ? eval(method.run as string) : method.run as Function;
                for (let j = 0; j < data.length; j++) {
                    const item: any = data[j];
                    this.setValue(item, method.on, fn(this.getValue(item, method.on, undefined, dataParam, map), context));
                }
            }
        }
        return data;
    }

    static each(data: any[], context: any, dataParam: any, map: Map): any[] {
        if (map.each) {
            for (let i = 0; i < data.length; i++) {
                map.each(data[i], i, data, context, dataParam, map);
            }
        }
        return data;
    }

    static iterator(map: MapItem | string, item: any, data: any, map2: Map): any {
        if (typeof map === 'string') return this.getValue(item, map, undefined, data, map2);

        const obj: any = {};
        for (const newkey in map) {
            if (map.hasOwnProperty(newkey)) {
                const oldkey: any = map[newkey];
                if (typeof oldkey === 'string') {
                    const value: any = this.getValue(item, oldkey, newkey, data, map2);
                    if (value !== undefined) obj[newkey] = value;
                } else if (Array.isArray(oldkey)) {
                    const array: any[] = [];
                    for (let i = 0; i < oldkey.length; i++) {
                        array.push(this.iterator(oldkey[i], item, data, map2));
                    }
                    obj[newkey] = array;
                } else if (typeof oldkey === 'object') {
                    obj[newkey] = this.iterator(oldkey, item, data, map2);
                } else {
                    obj[newkey] = "";
                }
            }
        }
        return obj;
    }

    static mapItems(list: any[], mapItem: MapItem, data: any, map: Map): any[] {
        const result: any[] = [];
        for (let i = 0; i < list.length; i++) {
            result.push(this.iterator(mapItem, list[i], data, map));
        }
        return result;
    }
}

export default DataTransform;
