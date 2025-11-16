import {useMemo} from "react";

class Node {
    static _newData = {};
    static newData() {
        return this._newData;
    }
}

class FileSystem extends Node {

}

class Data extends Node {

}

const nodeTypes = {
    Data,
    FileSystem,
};


export default nodeTypes;
