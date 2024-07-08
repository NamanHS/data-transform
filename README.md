# DATA TRANSFORMATION
The module for transforming and performing operations on JSON.
The library is very much inspired by node-json-transform npm package and it is **60% More fast compared node-json-transform** as it is not dependent on any other node packages (like lodash which causes performance issues in the node-json-transform npm package) for validations, iterations, mapping, demapping and transforming.



### Get Started

```typescript
import DataTransform from './DataTransform';

const data: any = { /* your data */ };
const map: Map = { /* your map */ };
const context: any = { /* your context */ };

const transformedData: any = DataTransform.transform(data, map, context);
```

### Transform API
transform (data, map, context)
#### Parameters
|Parameter|Type|Required|Description
|---|---|---|---|
|data| Object, Array|true |The JSON data that you want to transform|
|map| Object|true|How you want to tranform it|
|context| Object | false |Context to bind to for each item transformation. |

#### Returns
Object or Array based on input.

#####Object
If an object is passed in, it will transform the object and return the resulting object. 

##### Array 
If an array is passed in, each item will be iterated, transformed, and the entire result will be returned.  If no "list" is passed map, it will used the data as is.

### Map Schema
```javascript
{
  list: "",                // Not required.  If there is a sub-attribute in the incoming data that you want to used for tranformation rather than the data itself, you can specify that here.  It must point to an array.
  item: {                  // Required. Defines object mapping.
    destination: "source"  // The destination is the attribute name where source data will be mapped to in the result.  The path uses lodash.get function to find a value in the incoming data.
  },
  remove:['attribute'],    // Not required. Specifies an attribute to be removed from each item.
  defaults: {}             // Not required.  Specifies fallback values for attributes if they are missing.
  operate:[                // Not required.  Runs after object mapping. Modifies the attribute specified in "on".
    {
      run: "",             // Specifices the name of a function to run
      on: ""               // Specifies the attribute to be passed into the function above as a parameter
    }
  ],
  each: function(item){    // Not required.  Runs after object mapping and operations.  Allows access to each item for manipulation.
    return item;
  }
}
```

### Common Example

First we need some data.

```javascript
const data = {
  title : "title1",
  description: "description1",
  blog: "This is a blog.",
  date: "11/4/2013",
  extra : {
    link : "http://goo.cm"
  },
  list1:[
    {
      name:"mike"
    }
  ],
  list2:[
    {
      item: "thing"
    }
  ],
  clearMe: "text"
};
```

The map defines how the output will be structured and which operations to run.

```javascript
const map = {
  item: {
    name: "title",
    info: "description",
    text: "blog",
    date: "date",
    link: "extra.link",
    item: "list1.0.name",
    clearMe: "",
    fieldGroup: ["title", "extra"]
  },
  operate: [
    {
      run: "Date.parse", on: "date"
    },
    {
     run: function(val) { return val + " more info"}, on: "info"
    }
  ],
  each: function(item){
    item.iterated = true;
    return item; 
  }
};
```
You can read this as follows:
- Map the name to title, info to description etc.
- Run Data.parse on the date value.
- Run each function on all items after mapping and operations.


```javascript
transform(data, map).then((function(result){
  console.log(result);
});
```

The expected output.
```javascript
[
  {
    name : "title1",
    info: "description1",
    text: "This is a blog.",
    date: 1383544800000,
    link: "http://goo.cm",
    info: "mike more info",
    clearMe: "",
    fieldGroup: ["title1", { link : "http://goo.cm" }],
    iterated: true
  }
]
```


### Advanced Example

```javascript
const map = {
  item: {
    id: "id",
    sku: "sku",
    zero: "zero",
    toReplace: "sku",
    errorReplace: "notFound",
    simpleArray: ["id", "sku","sku"],
    complexArray: [ {node: "id"} , { otherNode:"sku" } , {toReplace:"sku"} ],
    subObject: {
      node1: "id",
      node2: "sku",
      subSubObject: {
        node1: "id",
        node2: "sku",
      }
    },
  },
  remove: ["unwanted"],
  defaults: {
    "missingData": true
  },
  operate: [
    {
      run: (val) => "replacement",
      on: "subObject.subSubObject.node1"
    },
    {
      run: (val) => "replacement",
      on: "errorReplace"
    },
    {
      run: (val) => "replacement",
      on: "toReplace"
    },
      {
      run: (val) => "replacement",
      on: "simpleArray.2"
    },
    {
      run: (val) => "replacement",
      on: "complexArray.2.toReplace"
    }
  ]
};

const object = [
  {
    id: "books",
    zero: 0,
    sku:"10234-12312",
    unwanted: true
  }
];

const result = transform(data, map);
```

The expected output.
```javascript
[
  {
    id: "books",
    sku: "10234-12312",
    zero: 0,
    toReplace: "replacement",
    errorReplace: "replacement",
    simpleArray: [
      "books",
      "10234-12312",
      "replacement"
    ],
    complexArray: [
      {
        node: "books"
      },
      {
        otherNode: "10234-12312"
      },
      {
        toReplace: "replacement"
      }
    ],
    subObject: {
      node1: "books",
      node2: "10234-12312",
      subSubObject: {
        node1: "replacement",
        node2: "10234-12312"
      }
    },
    missingData: true
]
```

### Multi-template Example

```javascript
const data = [
  {
    id: "books0",
    zero: 0,
    sku: "00234-12312",
    subitems: [
      { subid: "0.0", subsku: "subskuvalue0.0" },
      { subid: "0.1", subsku: "subskuvalue0.1" }
    ]
  }, {
    id: "books1",
    zero: 1,
    sku: "10234-12312",
    subitems: [
      { subid: "1.0", subsku: "subskuvalue1.0" },
      { subid: "1.1", subsku: "subskuvalue1.1" }
    ]
  }
];

const baseMap = {
  item : {
    "myid": "id",
    "mysku": "sku",
    "mysubitems": "subitems"
  },
  operate: [
    {
      run: function(ary) { 
        return transform(ary, nestedMap);
      }, 
      on: "mysubitems"
    }
  ]
};

const nestedMap = {
  "item" : {
    "mysubid": "subid",
    "mysubsku": "subsku"
  }
};

const result = transform(data, baseMap);
```

The expected output.

```javascript
[
  {
    "myid": "books0",
    "mysku": "00234-12312",
    "mysubitems": [
      { "mysubid": "0.0", "mysubsku": "subskuvalue0.0" }, 
      { "mysubid": "0.1", "mysubsku": "subskuvalue0.1"}
    ]
  }, 
  {
    "myid": "books1",
    "mysku": "10234-12312",
    "mysubitems": [
      { "mysubid": "1.0", "mysubsku": "subskuvalue1.0" }, 
      { "mysubid": "1.1", "mysubsku": "subskuvalue1.1" }
    ]
  }
]
```

### Context Example

First we need some data.

```javascript
const data = [
  {
    title : "title1",
    description: "description1"
  }
];
```

The map defines how the output will be structured and which operations to run.

```javascript
const map = {
  item: {
    name: "title",
    info: "description"
  },
  operate: [
    {
      run: function(val, context) { return val + " more info for" + context.type},
      on: "info"
    }
  ],
  each: function(item, index, collection, context){
    item.type = context.type;
    return item;
  }
};
```
