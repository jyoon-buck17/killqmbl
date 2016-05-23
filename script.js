/*global receiveFiles,DOMParser*/
!function(){
  
'use strict'

let state = "WAITING_FOR_FILES"
let qmbldata

let dropbox = document.getElementById('dropbox')
dropbox.addEventListener('click', function() {
  if (state !== "WAITING_FOR_FILES") return
  document.getElementsByName('picker')[0].click()
})

function sppd(e) {
  e.stopPropagation()
  e.preventDefault()
}

window.receiveFiles = function(files) {
  if (state !== "WAITING_FOR_FILES") return
  state = "PROCESSING_FILES"
  dropbox.innerHTML = 'Loading&hellip;'
  if (!files[0]) return
  let reader = new FileReader()
  let filename = files[0].name
  reader.readAsText(files[0], "UTF-8")
  reader.onload = function(e) {
    let data = e.target.result
    doParse(filename, data)
  }
  reader.onerror = function(e) {
    state = "WAITING_FOR_FILES"
    dropbox.innerHTML = 'An error occured.<p>Check the console for more information</p>'
  }
}

function doParse(title, data) {
  state = "PARSING"
  qmbldata = []
  let parser = new DOMParser()
  let dom = parser.parseFromString(data, 'text/xml')
  let documentobj = dom.children[0]
  let datasets = [].filter.call(documentobj.children, node=>node.nodeName === "DataSet")
 ;[].forEach.call(datasets, dataset=>{
    let thisDataset = {name: '', columns: []}
    let columns = []
   ;[].forEach.call(dataset.children, child=>{
      if (child.nodeName === 'DataSetName') {
        thisDataset.name = child.textContent
      }
      if (child.nodeName === "DataColumn") {
        let columnNode = child
        let thisColumn = {name: '', unit: '', cells: []}
       ;[].forEach.call(columnNode.children, child=>{
          if (child.nodeName === "DataObjectName") {
            thisColumn.name = child.textContent
          }
          if (child.nodeName === "ColumnUnits") {
            thisColumn.unit = child.textContent
          }
          if (child.nodeName === "ColumnCells") {
            thisColumn.cells = child.textContent.trim().split("\n")
          }
        })
        thisDataset.columns.push(thisColumn)
      }
    })
    qmbldata.push(thisDataset)
  })
  
  if (!qmbldata.length) {
    state = "WAITING_FOR_FILES"
    dropbox.innerHTML = "That file is either empty or not valid qmbl data.<p>Ready to accept another file</p>"
  }
  
  let table = []
  let tableLength = 0
  qmbldata.forEach(dataset=>{
    dataset.columns.forEach((column)=>{
      let row = [dataset.name, column.name, column.unit]
      column.cells.forEach(d=>row.push(d))
      if (row.length > tableLength) tableLength = row.length
      table.push(row)
    })
  })
  
  table.forEach(row=>row.length = tableLength)
  let tableT = table[0].map(function(col, i) { 
    return table.map(function(row) { 
      return (row[i] === undefined) ? "" : row[i]
    })
  })
  console.table(tableT)
  
  let out = tableT.map(l=>l.join(',')).join('\n')
  console.log(out)
  
  let download = document.createElement('a')
  download.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(out))
  download.setAttribute('download', title + '.csv')
  
  download.click()
  
  state = "WAITING_FOR_FILES"
  dropbox.innerHTML = 'Converted!<p>Ready to accept another file</p>'
}

dropbox.addEventListener("dragenter", function(e) {
  sppd(e)
  dropbox.classList.add('dropping')
}, false)
dropbox.addEventListener("dragover", function(e) {
  sppd(e)
  dropbox.classList.add('dropping')
}, false)
dropbox.addEventListener('dragleave', function(e) {
  sppd(e)
  dropbox.classList.remove('dropping')
}, false)
dropbox.addEventListener('dragout', function(e) {
  sppd(e)
  dropbox.classList.remove('dropping')
}, false)
dropbox.addEventListener("drop", function(e) {
  dropbox.classList.remove('dropping')
  sppd(e)
  receiveFiles(e.dataTransfer.files)
}, false)

}()