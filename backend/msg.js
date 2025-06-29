let key="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"
let arr=[]
let s=""
for (let i=0;i<key.length;i++){
    s+=key[i]
    if (i%5==4){
    arr.push(s)
    s=""
    }
}
arr[arr.length-1]+=key.slice(arr.length*5)
console.log(arr)
