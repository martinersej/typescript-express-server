import type Server from '@/types/Server';
import fs from 'fs';
import path from 'path';

function getFiles(dirPath: string, extension: string): string[] {
    const files = fs.readdirSync(dirPath);
    const fileLocations: string[] = [];

    files.forEach((file: any) => {
        // check if the files is a directory, and then loop though it
        if(fs.statSync(`${dirPath}/${file}`).isDirectory()){
            fileLocations.push(...getFiles(`${dirPath}/${file}`, extension));
        } else if ( (((extension != null) && ((Array.isArray(extension) && ((extension.includes(path.extname(file)) || (extension.filter((el) => {return (/^\s*$/.test(String(el))) == false}).length == 0))))) || (path.extname(file) == extension))) || (extension == null || /^\s*$/.test(String(extension)))) {
            fileLocations.push(`${dirPath}/${file}`);
        }
    })
    return fileLocations;
}

function loadFile<Type>(_path: string, server: Server): Type {
    return require(path.resolve(_path))(server);
}

function getRouteName(_path: string | string[]): string {
    const pathArr = _path = Array.isArray(_path) ? _path : _path.split("/");
    var baseName = "/";

    for (let j = 1; j < pathArr.length; j++) {
        if (pathArr[j + 1] == 'index.ts') baseName += `${pathArr[j]}/`;
        else if ((j > 1) && (j != (pathArr.length - 1))) baseName += `${pathArr[j]}/`;
        else if (pathArr.length - 2 == j && !pathArr[j].includes('.ts')) baseName += `${pathArr[j]}/`;
        else if (pathArr[j] != 'index.ts') baseName += `${`${pathArr[j]}`.replace('.ts', '')}/`;
    }
    return baseName;
}

module.exports = { getFiles, loadFile, getRouteName };