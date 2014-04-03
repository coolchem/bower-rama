
/**
 * RamaJS JavaScript Framework v1.0
 * DEVELOPED BY
 * Varun Reddy Nalagatla
 * varun8686@gmail.com
 *
 * Copyright 2014 Varun Reddy Nalagatla a.k.a coolchem
 * Released under the MIT license
 *
 * FORK:
 * https://github.com/coolchem/rama
 */

'use strict';

(function(window, document) {'use strict';
var LIBRARY_RAMA = "$r";
var R_APP = "rapp";

var libraryDictionary = {};


var library = function (libraryName) {

    var library = libraryDictionary[libraryName];
    if (library)
        return library;
    else {
        return constructLibrary(libraryName);
    }
};

//constructing core Library which is rama
var $r = window.$r = constructLibrary(LIBRARY_RAMA);
$r.library = library;
$r.$$libraryDictionary = libraryDictionary;

$r.Application = function (applicationname, constructor) {
    var newClassItem = {};
    newClassItem.name = applicationname;
    newClassItem.constructor = constructor;
    newClassItem.constructor.className = applicationname;
    newClassItem.superClassItem = $r("Application").classItem;
    newClassItem.library = $r;
    $r.$$classDictionary[applicationname] = newClassItem;
};


function initApplications() {

    var appNodes = $(document).find('[' + R_APP + ']');

    for (var i = 0; i < appNodes.length; i++) {
        var appNode = $(appNodes[i]);
        var application = $r.Class(appNode.attr(R_APP));

        if (application) {
            initApplication(application, appNode)
        }
    }

}

function initApplication(application, appNode) {

    var applicationManager = new ApplicationManager(application, appNode);
    applicationManager.initialize();

}

function ApplicationManager(applicationClass, rootNode) {

    var appClass = applicationClass;

    this.application = null;
    this.applicationNode = rootNode;


    this.initialize = function () {

        this.application = $r.$$componentUtil.createComponent(rootNode[0], appClass);
        this.application.applicationManager = this;
        rootNode.replaceWith(this.application);
        this.application.initialize();
        this.application.inValidate();
    }

}

//core functions
function constructLibrary(libraryName) {

    var library = function (className) {

        var classItem = library.$$classDictionary[className];

        if (classItem === null || classItem === undefined) {

            //this means the class has never been register in the library so
            //so register the Class into library
            var newClassItem = {};
            newClassItem.name = className;
            newClassItem.constructor = function () {
            };
            newClassItem.constructor.className = className;
            newClassItem.superClassItem = null;
            newClassItem.library = library;

            library.$$classDictionary[className] = newClassItem;


        }

        classItem = library.$$classDictionary[className];

        //1.when i get class name, I need to register the class somewhere

        //2.then return a function so user can register a constructor class for the given classname

        //3.also the return function should have an extend function which take the argument of a return value of requesting a class name which is essentially a constructor

        //4.the extend function should then register that constructor as base class for the class registered in step 2

        var returnFunction = function (construcotr) {

            returnFunction.classItem.constructor = construcotr;

        };


        returnFunction.extends = function (baseClassItem) {

            var classItem = this.classItem;
            var superClassItem = baseClassItem;
            return function (constructor) {

                classItem.constructor = constructor;
                classItem.superClassItem = superClassItem.classItem;
            };
        };


        returnFunction.classItem = classItem;


        return returnFunction;

    };

    library.$$classDictionary = {};
    library.libraryName = libraryName;

    library.$skins = {};


    library.skins = function () {

        for (var i in arguments) {
            var skinItem = arguments[i];
            library.$skins[skinItem.Class] = skinItem;
        }
    };

    library.skinClass = function (className) {

        var skinClassItem = library.$skins[className];

        if(skinClassItem === null || skinClassItem === undefined || skinClassItem.Class === null ||  skinClassItem.Class === "")
        {
            throw new ReferenceError("Skin Class Note Found Exception: The requested Skin Class " + className + " could not be found\n" +
                    "Please Make sure it is registered properly in the library ");
        }
        else
        {
            return library.libraryName + ":" + className;
        }


    };

    library.Class = function (className) {

        var classItem = library.$$classDictionary[className];

        if(classItem === null || classItem === undefined || classItem.constructor === null ||  classItem.constructor === undefined)
        {
            throw new ReferenceError("Class Note Found Exception: The requested Class " + className + " could not be found\n" +
                    "Please Make sure it is registered in the library ");
        }
        else
        {
            if(classItem.superClassItem !== null && classItem.superClassItem !== undefined)
            {
                var constructor = function () {
                    var baseClass = classItem.superClassItem.library.Class(classItem.superClassItem.name);
                    var subClass = classItem.constructor;
                    return classConstructor.constructClass(baseClass, subClass);
                };
                return constructor
            }
            else
            {
                return classItem.constructor;
            }

        }


    };

    libraryDictionary[libraryName] = library;

    return library;

}

var classConstructor = {};
(function () {

    var initializing = false;

    classConstructor.constructClass = function (baseClass, subClass) {

        initializing = true;
        var _super = new baseClass();
        var baseObject = new baseClass();
        initializing = false;


        function _superFactory(name, fn) {
            return function () {
                var tmp = this._super;

                /* Add a new ._super() method that is the same method */
                /* but on the super-class */
                this._super = _super[name];

                /* The method only need to be bound temporarily, so we */
                /* remove it when we're done executing */
                var ret = fn.apply(this, arguments);
                this._super = tmp;

                return ret;
            };
        }

        function _getSetsuperFactory(name, fn, source) {
            return function () {
                var tmp = this._super;

                /* Add a new ._super() method that is the same method */
                /* but on the super-class */
                this._super = source[name];

                /* The method only need to be bound temporarily, so we */
                /* remove it when we're done executing */
                var ret = fn.apply(this, arguments);
                this._super = tmp;

                return ret;
            };
        }


        var constructorInstance = new subClass();

        for (var name in constructorInstance) {
            if (typeof constructorInstance[name] === "function" && typeof _super[name] === "function") {
                baseObject[name] = _superFactory(name, constructorInstance[name])
            }
            else {
                var propertyDescriptor = Object.getOwnPropertyDescriptor(constructorInstance, name);
                if (propertyDescriptor !== undefined && (propertyDescriptor.hasOwnProperty("get") || propertyDescriptor.hasOwnProperty("set"))) {
                    var newPrototypeDescripter = {};
                    for (var descriptorName in propertyDescriptor) {
                        if (typeof propertyDescriptor[descriptorName] === "function") {
                            newPrototypeDescripter[descriptorName] = _getSetsuperFactory(descriptorName, propertyDescriptor[descriptorName], propertyDescriptor)
                        }
                        else {
                            newPrototypeDescripter[descriptorName] = propertyDescriptor[descriptorName]
                        }
                    }
                    Object.defineProperty(baseObject, name, newPrototypeDescripter);
                }
                else {
                    baseObject[name] = constructorInstance[name];
                }

            }
        }

        /* The dummy class constructor */
        function RClass() {
            if (!initializing && this.super) {
                this.super.apply(this, arguments);
            }

            if (!initializing && this.$$super) {
                this.$$super.apply(this, arguments);
            }
        }

        /* Populate our constructed prototype object */
        RClass.prototype = baseObject;

        /* Enforce the constructor to be what we expect */
        RClass.prototype.constructor = subClass;

        RClass.className = subClass.className;

        return new RClass();
    }

}());


$r.$$ClassList = {

    APPLICATION: {className:"Application", importToLibrary:false},
    COMPONENT: {className:"Component", importToLibrary:true},
    GROUP_BASE: {className:"GroupBase", importToLibrary:true},
    GROUP: {className:"Group", importToLibrary:true},
    DATA_GROUP: {className:"DataGroup", importToLibrary:true},
    LAYOUT_BASE: {className:"LayoutBase", importToLibrary:true},
    SKIN: {className:"Skin", importToLibrary:false},
    SKINNABLE_COMPONENT: {className:"SkinnableComponent", importToLibrary:true},
    SKINNABLE_CONTAINER: {className:"SkinnableContainer", importToLibrary:true}

};
$r("Component")(function () {

    this.compid = "";
    this.comp = "";
    this.initialized = false;
    this.parentComponent = null;

    this.elements = [];

    this.super = function () {

    };

    this.$$super = function () {

        $.extend(this, $("<div></div>")); //every component starts of as empty div
    };

    this.initialize = function () {

        if (this.initialized)
            return;
        this.$$createChildren();
        this.$$childrenCreated();

        this.initialized = true;
    };

    this.inValidate = function () {

    };

    this.addElement = function (element) {
        element.parentComponent = this;
        element.initialize();
        this.elements.push(element);
        this.append(element);
    };

    this.removeElement = function (element) {

        this.remove(element);
    };


    this.$$createChildren = function () {

    };


    this.$$childrenCreated = function () {

    };


});

$r("GroupBase").extends($r("Component"))(function () {

    var classUtil = $r.$$classUtil;

    var componentUtil = $r.$$componentUtil;

    var _htmlContent = [];
    Object.defineProperty(this, "htmlContent",
            {   get:function () {
                return _htmlContent;
            },
                set:function (newValue) {
                    _htmlContent = newValue;
                    setHTMLContent(this);
                },
                enumerable:true,
                configurable:true
            });

    this.$$createChildren = function () {

        if (this.htmlContent.length > 0) {
            for (var i = 0; i < this.htmlContent.length; i++) {
                var componentClassName = $(this.htmlContent[i]).attr(componentUtil.R_COMP);
                var comp = componentUtil.createComponent(this.htmlContent[i], classUtil.classFactory(componentClassName));
                this.addElement(comp);
            }
        }
    };

    function setHTMLContent(_this) {
        if (_this.initialized) {
            _this[0].innerHTML = "";
            _this.$$createChildren();
        }
    }
});

$r("DataGroup").extends($r("GroupBase"))(function () {


});

$r("Group").extends($r("GroupBase"))(function () {


});

$r("Skin").extends($r("Group"))(function () {

    var componentUtil = $r.$$componentUtil;

    this.getSkinPart = function (compId) {

        var element = null;

        var dynamicElements = this.find('[' + componentUtil.COMP_ID + '=' + compId + ']');
        var skinPartDictionaryElement = $r.$$componentUtil.skinPartDictionary[compId];

        if (skinPartDictionaryElement && dynamicElements && dynamicElements.length > 0) {
            if (skinPartDictionaryElement[0] === dynamicElements[0])
                return skinPartDictionaryElement;
        }

        return element;
    }
});

$r("SkinnableComponent").extends($r("Component"))(function () {

    var _inValidating = false;

    var _skinElement = null;

    var _skinClass;

    var classUtil = $r.$$classUtil;

    var componentUtil = $r.$$componentUtil;

    Object.defineProperty(this, "skinClass",
            {   get:function () {
                return _skinClass;
            },
                set:function (newValue) {
                    _skinClass = newValue;
                },
                enumerable:true,
                configurable:true
            });

    var _skinParts = [];
    Object.defineProperty(this, "skinParts",
            {   get:function () {
                return _skinParts;
            },
                set:function (newValue) {
                    defineSkinParts(newValue);
                },
                enumerable:true,
                configurable:true
            });

    function defineSkinParts(skinPartss) {

        for (var i = 0; i < skinPartss.length; i++) {
            _skinParts.push(skinPartss[i]);
        }

    }

    this.$$createChildren = function () {
        attachSkin(this);
    };

    this.$$childrenCreated = function () {
        this._super();
        findSkinParts(this);
    };


    function attachSkin(_this) {

        _skinElement = componentUtil.createComponent(classUtil.skinFactory(_this), $r.Class("Skin"));
        _this.addElement(_skinElement);

        if (_inValidating) {
            _skinElement.inValidate();
            _inValidating = false;
        }
    }


    this.partAdded = function (partName, instance) {
        //Override this method to add functionality to various skin component
    };


    this.inValidate = function () {

        this._super();
        if (_skinElement) {
            _skinElement.inValidate();
            _inValidating = false;
        }
        else
            _inValidating = true;

    };

    function findSkinParts(_this) {
        if (_skinElement) {
            for (var j = 0; j < _this.skinParts.length; j++) {
                var skinPart = _this.skinParts[j];
                var skinPartFound = false;

                var skinPartElement = _skinElement.getSkinPart(skinPart.id);

                if (skinPartElement) {
                    skinPartFound = true;
                    _this[skinPart.id] = skinPartElement;
                    _this.partAdded(skinPart.id, skinPartElement)
                }

                if (skinPart.required === true && !skinPartFound) {
                    throw new ReferenceError("Required Skin part not found: " + skinPart.id + " in " + _this.skin);
                }
            }
        }
    }

});

$r("SkinnableContainer").extends($r("SkinnableComponent"))(function () {

    var _htmlContent = [];
    Object.defineProperty(this, "htmlContent",
            {   get:function () {
                return _htmlContent;
            },
                set:function (newValue) {
                    _htmlContent = newValue;
                },
                enumerable:true,
                configurable:true
            });

    this.skinParts = [
        {id:'contentGroup', required:true}
    ];

    this.contentGroup = null;

    this.partAdded = function (partName, instance) {

        this._super(partName, instance);

        if (instance === this.contentGroup) {
            this.contentGroup.htmlContent = this.htmlContent;
        }
    };

});

$r("Application").extends($r("SkinnableComponent"))(function () {

    this.applicationManager = null;

});

$r("LayoutBase")(function () {

    this.target = null;

    this.updateLayout = function () {

        console.log(this.target);
    };

});


$r.$$classUtil = (function(){

    var LIBRARY_RAMA = "$r";
    var R_APP = "rapp";

    var libraryDictionary = $r.$$libraryDictionary;

    var classFactory =  function(className)
    {
        var libraryAndClass = getLibraryAndClass(className);

        if(libraryAndClass && libraryAndClass.library && libraryAndClass.className && libraryAndClass.className !== "")
        {
            return libraryAndClass.library.Class(libraryAndClass.className);
        }

        return null;

    };

    var skinFactory = function(component)
    {
        var skinNode = null;

        var skinClassName = component.skinClass;

        if(!skinClassName || skinClassName !== "")
        {
            var libraryAndClass = getLibraryAndClass(skinClassName);

            if(libraryAndClass.library && libraryAndClass.className && libraryAndClass.className !== "")
            {
                var skinItem = libraryAndClass.library.$skins[libraryAndClass.className];

                if(skinItem.skin && skinItem.skin !== "")
                {
                    skinNode = $(skinItem.skin)[0];
                }
                else if(skinItem.skinURL && skinItem.skinURL !== "")
                {
                    skinItem.skin = getRemoteSkin(skinItem.skinURL);

                    skinNode = $(skinItem.skin)[0];
                }
            }

        }

        return skinNode;
    };





    function getRemoteSkin(skinURL) {
        return $.ajax({
            type: "GET",
            url: skinURL,
            async: false
        }).responseText;
    }

    function getLibraryAndClass(className)
    {
        var libraryAndClass = null;
        if(className !== undefined && className !== "")
        {
            libraryAndClass = {};
            var names = className.split(':');

            var libraryName = LIBRARY_RAMA;
            var extractedClassName = "";

            if(names.length > 1)
            {
                libraryName = names[0];
                extractedClassName = names[1];
            }
            else if(names.length === 1)
            {
                extractedClassName = names[0];
            }

            libraryAndClass.library = libraryDictionary[libraryName];
            libraryAndClass.className = extractedClassName;
        }

        return libraryAndClass;
    }


    return {

        classFactory:classFactory,
        skinFactory:skinFactory,
        LIBRARY_RAMA:LIBRARY_RAMA

    };

}());

$r.$$componentUtil = (function(){



    var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
    var MOZ_HACK_REGEXP = /^moz([A-Z])/;



    var R_COMP = "comp";
    var COMP_ID = "compid";

    var skinPartDictionary = {};

    var createComponent =  function(node,componentClass)
    {
        var component = null;

        if(componentClass !== undefined && componentClass != null && componentClass !== "")
        {
            component = new componentClass();
        }
        else
        {
            component = new $r.Class("Group")();
            component[0] = node;
        }

        //applying node attributes

        if(node.attributes !== undefined && node.attributes.length > 0)
        {
            $.each(node.attributes, function() {
                component.attr(this.name, this.value);
            });

            applyAttributes(component, node.attributes);
        }



        //setting up html content

        var children = $(node).children();

        if(children !== undefined && children.length > 0)
        {
            //setting innerHTML to empty so that children are created through normal process
            component[0].innerHTML = "";
            for(var i=0; i< children.length; i++)
            {
                var childNode = children[i];
                component.htmlContent.push(childNode);
            }
        }

        registerSkinPart(component);

        return component;
    };

    function registerSkinPart(component)
    {
        if(component.attr(COMP_ID) && component.attr(COMP_ID) !== "")
        {
            skinPartDictionary[component.attr(COMP_ID)] = component;
        }
    }

    function applyAttributes(object, attrs)
    {
        for(var i=0; i< attrs.length; i++)
        {
            var attr = attrs[i];
            object[camelCase(attr.name.toLowerCase())] = attr.value;
        }
    }

    function camelCase(name) {
        return name.
                replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
                    return offset ? letter.toUpperCase() : letter;
                }).
                replace(MOZ_HACK_REGEXP, 'Moz$1');
    }

    function cleanWhitespace(node)
    {
        for (var i=0; i<node.childNodes.length; i++)
        {
            var child = node.childNodes[i];
            if(child.nodeType == 3 && !/\S/.test(child.nodeValue))
            {
                node.removeChild(child);
                i--;
            }
            if(child.nodeType == 1)
            {
                cleanWhitespace(child);
            }
        }
        return node;
    }


    return {
        R_COMP:R_COMP,
        COMP_ID:COMP_ID,
        createComponent:createComponent,
        skinPartDictionary:skinPartDictionary
    };
}());

    $(document).ready(function() {
        initApplications();
    });


})(window, document);