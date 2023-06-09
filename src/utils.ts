export const getRandomInt = (max: number = 4): number => Math.floor(Math.random() * max)

export const arrayFromLength = (length: number): number[] => Array.from({ length }, (_, idx) => idx + 1)

export const getParsedProxy = (object: any) => JSON.parse(JSON.stringify(object))