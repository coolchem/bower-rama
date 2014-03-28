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
(function(window, document) {'use strict';

    var libraryDictionary = {};
    var LIBRARY_RAMA = "rama";
    var R_APP = "rapp";
    var RX_LAYOUT = "LAYOUT";
    var RX_STATES = "STATES";
    var R_COMP = "comp";
    var COMP_ID = "compid";

    var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
    var MOZ_HACK_REGEXP = /^moz([A-Z])/;

    var skinPartDictionary = {};

    var library = function(libraryName){

       var library = libraryDictionary[libraryName];
       if(library)
         return library;
       else
       {
           return constructLibrary(libraryName);
       }
    };

    //constructing core Library which is rama
    var rama = window.rama = constructLibrary(LIBRARY_RAMA);
    rama.library = library;

    rama.Group.extend("Skin", function(){

        this.getSkinPart = function(compId){

            var element = null;

            var dynamicElements = this.find('[' + COMP_ID + '=' + compId + ']');
            var skinPartDictionaryElement = skinPartDictionary[compId];

            if( skinPartDictionaryElement && dynamicElements && dynamicElements.length > 0)
            {
                if(skinPartDictionaryElement[0] === dynamicElements[0])
                    return skinPartDictionaryElement;
            }

            return element;
        }
    });

    rama.SkinnableComponent.extend("Application", function(){

        this.applicationManager = null;
    });

    function initApplications(){

        var appNodes = $(document).find('[' + R_APP + ']');

        for(var i=0; i< appNodes.length; i++)
        {
            var appNode = $(appNodes[i]);
            var application = rama[appNode.attr(R_APP)];

            if(application)
            {
                initApplication(application, appNode)
            }
        }

    }

    function initApplication(application, appNode){

        var applicationManager = new ApplicationManager(application, appNode);
        applicationManager.initialize();

    }

    function ApplicationManager(applicationClass, rootNode){

        var appClass = applicationClass;

        this.application = null;
        this.applicationNode = rootNode;


        this.initialize = function(){

            this.application = createComponent(rootNode[0], appClass);
            this.application.applicationManager = this;
            rootNode.replaceWith(this.application);
            this.application.initialize();
            this.application.inValidate();
        }

    }

    function constructLibrary(libraryName){

        var Class;

        var library = {};
        libraryDictionary[libraryName] = library;

        (function(){

            var initializing = false;

            Class = function(){};

            Class.extend = function(classname, constructor)
            {
                var thisClass = this;
                var newClass = function(){
                    var baseClass = thisClass;
                    var subClass = constructor;
                    var className = classname;

                    var constructedClass = constructClass(baseClass, subClass, className);

                    return constructedClass;
                };
                newClass.extend = Class.extend;

                if(classname)
                {
                    library[classname] = newClass;
                }

                return newClass;
            };

            function constructClass(baseClass, subClass, subClassName)
            {

                initializing = true;
                var _super = new baseClass();
                var baseObject = new baseClass();
                initializing = false;


                function _superFactory(name,fn) {
                    return function() {
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

                function _getSetsuperFactory(name,fn,source) {
                    return function() {
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
                    if(typeof constructorInstance[name] === "function" && typeof _super[name] === "function")
                    {
                        baseObject[name] = _superFactory(name,constructorInstance[name])
                    }
                    else
                    {
                        var propertyDescriptor =  Object.getOwnPropertyDescriptor(constructorInstance,name);
                        if( propertyDescriptor !== undefined && (propertyDescriptor.hasOwnProperty("get") || propertyDescriptor.hasOwnProperty("set")))
                        {
                            var newPrototypeDescripter = {};
                            for(var descriptorName in propertyDescriptor)
                            {
                                if(typeof propertyDescriptor[descriptorName] === "function" )
                                {
                                    newPrototypeDescripter[descriptorName] = _getSetsuperFactory(descriptorName,propertyDescriptor[descriptorName],propertyDescriptor)
                                }
                                else
                                {
                                    newPrototypeDescripter[descriptorName] = propertyDescriptor[descriptorName]
                                }
                            }
                            Object.defineProperty(baseObject,name, newPrototypeDescripter);
                        }
                        else
                        {
                            baseObject[name] = constructorInstance[name];
                        }

                    }
                }

                /* The dummy class constructor */
                function RClass() {
                    if ( !initializing && this.super ) {
                        this.super.apply(this, arguments);
                    }

                    if ( !initializing && this.$$super ) {
                        this.$$super.apply(this, arguments);
                    }
                }

                /* Populate our constructed prototype object */
                RClass.prototype = baseObject;

                /* Enforce the constructor to be what we expect */
                RClass.prototype.constructor = subClass;

                RClass.className = subClassName;

                return new RClass();
            }

        }());

        Class.extend("Component", function(){

            this.compid = "";
            this.comp = "";
            this.initialized = false;
            this.parentComponent = null;

            this.elements = [];

            this.super = function()
            {

            };

            this.$$super = function(){

                $.extend(this, $("<div></div>")); //every component starts of as empty div
            };

            this.initialize = function(){

                if(this.initialized)
                    return;
                this.$$createChildren();
                this.$$childrenCreated();

                this.initialized = true;
            };

            this.inValidate = function(){

            };

            this.addElement = function(element){
                element.parentComponent = this;
                element.initialize();
                this.elements.push(element);
                this.append(element);
            };

            this.removeElement = function(element){

                this.remove(element);
            };


            this.$$createChildren = function(){

            };


            this.$$childrenCreated = function(){

            };


        });

        Class.extend("Layout", function()
        {
            this.target = null;

            this.updateLayout = function(){

                console.log(this.target);
            };
        });

        library.Component.extend("Group", function(){

            var _htmlContent = [];
            Object.defineProperty(this, "htmlContent",
                    {   get : function(){
                        return _htmlContent;
                    },
                        set : function(newValue){
                            _htmlContent = newValue;
                            setHTMLContent(this);
                        },
                        enumerable : true,
                        configurable : true
                    });

            this.$$createChildren = function(){

                if(this.htmlContent.length > 0)
                {
                    for(var i = 0; i< this.htmlContent.length; i++)
                    {
                        var componentClassName = $(this.htmlContent[i]).attr(R_COMP);
                        var comp = createComponent(this.htmlContent[i],classFactory(componentClassName));
                        this.addElement(comp);
                    }
                }
            };

            function setHTMLContent(_this)
            {
                if(_this.initialized)
                {
                    _this[0].innerHTML = "";
                    _this.$$createChildren();
                }
            }
        });

        library.Component.extend("SkinnableComponent", function(){

            var _inValidating = false;

            var _skinElement = null;

            var _skinClass;

            Object.defineProperty(this, "skinClass",
                    {   get : function(){
                        return _skinClass;
                    },
                        set : function(newValue){
                            _skinClass = newValue;
                        },
                        enumerable : true,
                        configurable : true
                    });

            var _skinParts = [];
            Object.defineProperty(this, "skinParts",
                    {   get : function(){
                        return _skinParts;
                    },
                        set : function(newValue){
                            defineSkinParts(newValue);
                        },
                        enumerable : true,
                        configurable : true
                    });

            function defineSkinParts(skinPartss){

                for (var i = 0; i < skinPartss.length; i++) {
                    _skinParts.push(skinPartss[i]);
                }

            }

            this.$$createChildren = function(){
                attachSkin(this);
            };

            this.$$childrenCreated = function(){
                this._super();
                findSkinParts(this);
            };


            function attachSkin(_this){

                _skinElement = createComponent(skinFactory(_this), rama.Skin);
                _this.addElement(_skinElement);

                if(_inValidating)
                {
                    _skinElement.inValidate();
                    _inValidating = false;
                }
            }



            this.partAdded = function(partName, instance){
                //Override this method to add functionality to various skin component
            };




            this.inValidate = function(){

                this._super();
                if(_skinElement)
                {
                    _skinElement.inValidate();
                    _inValidating = false;
                }
                else
                    _inValidating = true;

            };

            function findSkinParts(_this){
                if(_skinElement)
                {
                    for(var j=0; j< _this.skinParts.length; j++)
                    {
                        var skinPart = _this.skinParts[j];
                        var skinPartFound = false;

                        var skinPartElement = _skinElement.getSkinPart(skinPart.id);

                        if(skinPartElement)
                        {
                            skinPartFound = true;
                            _this[skinPart.id] = skinPartElement;
                            _this.partAdded(skinPart.id,skinPartElement)
                        }

                        if(skinPart.required === true && !skinPartFound)
                        {
                            throw new TypeError("Required Skin part not found: " + skinPart.id + " in " +_this.skin );
                        }
                    }
                }
            }

        });

        library.SkinnableComponent.extend("SkinnableContainer", function(){

            var _htmlContent = [];
            Object.defineProperty(this, "htmlContent",
                    {   get : function(){
                        return _htmlContent;
                    },
                        set : function(newValue){
                            _htmlContent = newValue;
                        },
                        enumerable : true,
                        configurable : true
                    });

            this.skin = '<div comp="Skin">' +
                    '<div comp="Group" compid="contentGroup">' +
                    '</div>' +
                    '</div>';

            this.skinParts = [{id:'contentGroup', required:true}];

            this.contentGroup = null;

            this.partAdded = function(partName, instance){

                this._super(partName, instance);

                if(instance === this.contentGroup)
                {
                    this.contentGroup.htmlContent = this.htmlContent;
                }
            };

        });


        library.Class = Class;

        library.$skins = {};

        library.skins = function (){

            for( var i in arguments)
            {
                var skinItem = arguments[i];
                library.$skins[skinItem.Class] = skinItem;
            }
        };

        return library;

    }

    function classFactory(className)
    {
        var libraryAndClass = getLibraryAndClass(className);

        if(libraryAndClass && libraryAndClass.library && libraryAndClass.className && libraryAndClass.className !== "")
        {
            return libraryAndClass.library[libraryAndClass.className];
        }

        return null;

    }

    function skinFactory(component)
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

    function registerSkinPart(component)
    {
        if(component.attr(COMP_ID) && component.attr(COMP_ID) !== "")
        {
            skinPartDictionary[component.attr(COMP_ID)] = component;
        }
    }

    function setLayout(component, layoutNode)
    {
        if(layoutNode.childNodes && layoutNode.childNodes.length > 0)
        {
            layoutNode = cleanWhitespace(layoutNode);
            var layoutTypeNode = layoutNode.childNodes[0];
            var layout = rama[camelCase(layoutTypeNode.tagName.toLowerCase())];
            if(layout)
            {
                component.layout = new layout();
                component.layout.target = component;
                applyAttributes(component.layout, layoutTypeNode.attributes)
            }
        }
    }

    function createComponent(node,componentClass)
    {
        var component = null;

        if(componentClass !== undefined && componentClass != null && componentClass !== "")
        {
            component = new componentClass();
        }
        else
        {
            component = new rama.Group();
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
    }



    function setStates(component, statesNode)
    {
        if(statesNode.childNodes && statesNode.childNodes.length > 0)
        {
            if(!component.states)
                component.states = [];
            for(var i=0; i< statesNode.childNodes.length; i++)
            {
               var state = {};
               var stateNode = statesNode.childNodes[i];
               applyAttributes(state, stateNode.attributes);
               component.states.push(state);
            }
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

    function isString(value){return typeof value == 'string';}

    function getRemoteSkin(skinURL) {
        return $.ajax({
            type: "GET",
            url: skinURL,
            async: false
        }).responseText;
    }

    $(document).ready(function() {
        initApplications();
    });

})(window, document);
