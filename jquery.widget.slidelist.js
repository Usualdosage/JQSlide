
/**
* Converts a hierarchical JSON object into an animated "iPhone style" slider list
*
* @example $('#slideList').slideList();
* @desc Creates an iPhone style sliding menu bound to a JSON object with breadcrumbs (optional).
*
* @example $('#slideList').slideList({ selectionChanged: function(item) { alert('Selection changed!')  } });
*
* @return When an item (not a sub menu) is selected, the selectionChanged event is raised and an LI like the following
* is returned: <li class=​"menuItem" value=​"3">​Sub Sub Item 1​</li>​
*
* @desc Create an "iphone style" sliding list with n-nested menu items. List binds to a JSON object (see schema below)
* @data The JSON data should be in the following shape:
*{
* "menu": {
*     "menuitems": [
*         {
*             "text": "Parent Item 1",
*             "value": "1",
*             "menuitems": [
*                 {
*                     "text": "Sub Item 1",
*                     "value": "2",
*                     "menuitems": [
*                     {
*                         "text": "Sub Sub Item 1",
*                         "value": "3",
*                         // etc, etc
*                     }
*                 }
*             ]
*         }
*     }
* }
* @name slideList
* @type jQuery
* @param Function handler for selection changed.
* @cat Plugins/slideList
* @return jQuery
* @author Matt Martin
*/

; (function ($) {
    $.widget("jquery.slideList", {
    
        options: {
            selectionChanged: function (selectedItem) { }, // Event to fire when a new item is selected
            selectorText: "Choose One", // The default text to indicate a selection
            viewModel: {}, // The JSON data source of the menu (see docs)
            showBreadcrumbs: true, // When true, will display backward navigation
            slideSpeed: 125, // Speed, in ms, in which the menus will appear
            tabIndexSeed: 1000, // The seed to start counting tabindexes for each menu generated
            pointer: "&raquo;", // The glyph to use between breadcrumbs
            rootBreadcrumbText: "All" // The text to display to navigate to "home"
        },

        // Set up the widget
        _create: function () {

            var container = $(this.element);
            var configOpts = this.options;
            var jsonModel = configOpts.viewModel;

            container.addClass("slideListContainer");

            // Every container needs a tab index to allow blur() to work
            $(".slideListContainer").each(function(e, item) { 
                $(item).attr("tabindex", e + configOpts.tabIndexSeed);
            });

            ConfigureMainMenu(container, "inactive");

            // Adds the root level menu to the container and wires up the events
            function ConfigureMainMenu(container, transition)
            {
                var html = "<ul><li class='selectorText' state='" + transition + "'>" + configOpts.selectorText + "</li></ul><div state='inactive' class='menuItems' style='display: none'><ul class='subMenu'>";
             
                // Add the items
                for (var x=0, al = jsonModel.menu.menuitems.length; x < al; x++)
                {
                    var m = jsonModel.menu.menuitems[x];
                    var className = (m.menuitems && m.menuitems.length > 0) ? " hasChildren" : "";
                    html += "<li class='menuItem" + className + "' value='" + m.value + "'>" + m.text + "</li>";
                }

                // Close the box
                html += "</ul></div>";
                container.html(html);

                var menuItems = container.find(".menuItems");

                // Returning from clicking "home"
                if (transition == "transitioning")
                {
                    var targetList = container.find(".menuItems");
                    targetList.show("slide", { direction: "left" }, configOpts.slideSpeed);
                    targetList.attr("state", "active");
                    $(this).attr("state", "active");
                }

                // Show/hide the list when clicked
                container.find(".selectorText").on("click", function() { 
                
                    var selector = $(this);

                    // Update the state (CSS hooks)
                    selector.attr("state", "inactive");

                    var targetList = container.find(".menuItems");

                    // We only want open on the page at a time so slide them all up (except the one we are targeting)
                    var allMenus = $(".menuItems").not(targetList);
                    allMenus.slideUp("fast");
                    allMenus.attr("state", "inactive");
                    var state = targetList.attr("state");

                    // Now show the target list (or hide if we're toggling)
                    if (state == "active")
                    {
                        targetList.slideUp(configOpts.slideSpeed);
                        targetList.attr("state", "inactive");
                         $(this).attr("state", "inactive");
                    }
                    else
                    {
                        targetList.slideDown(configOpts.slideSpeed);
                        targetList.attr("state", "active");
                        $(this).attr("state", "active");
                    }
                });

                // When the user clicks outside the div, hide the stuff
                container.focusout(function() { 
                    var targetList = container.find(".menuItems");
                    targetList.slideUp(configOpts.slideSpeed);
                    targetList.attr("state", "inactive");
                    $(this).find(".selectorText").attr("state", "inactive");
                });

                // Wire up the click event of the menu item to slide the menu when selected
                container.find(".menuItem").on("click", function() { 
                    ShowSubmenu($(this), jsonModel.menu, "right");
                });
            }

            // Generates the breadcrumb trail at the top of the selector and hooks up events to navigate
            function ShowBreadcrumbs(li, menu)
            {
                var selector = container.find(".selectorText");
                var selectedText = li.text();
                var selectedValue = li.attr("value");
                
                // Pull the stored text & value arrays from the data object
                var storedMeta = selector.data("storedMeta");
                if (!storedMeta) // Doesn't exist so create the object
                {
                    storedMeta = new Array(new Array(), new Array());
                }
                
                // Stored meta contains two arrays, the first for text values, the second for key values
                var crumbs = storedMeta[0];
                var routes = storedMeta[1];
                var isSameLevel = false;

                // If the newly selected menu item is at the same level as the current selection, replace it
                if (menu.menuitems)
                {
                    var lastSelection = crumbs[crumbs.length - 1];
                    if (lastSelection)
                    {
                        for (var x=0, ml = menu.menuitems.length - 1; x <= ml; x++)
                        {
                            if (lastSelection == menu.menuitems[x].text)
                            {
                                // Yes, this is at the same level, so replace the crumb & route and push them back into
                                // the list variables
                                isSameLevel = true;
                                crumbs[crumbs.length - 1] = selectedText;
                                routes[routes.length - 1] = selectedValue;
                            }
                        }
                    }
                }

                if (!isSameLevel)
                {
                    // Not at same level, so append
                    if (selectedText && selectedText != "" && selectedText != "undefined")
                    {
                        crumbs.push(selectedText);
                    }

                    if (selectedValue && selectedValue != "")
                    {
                        routes.push(selectedValue);
                    }
                }

                // Update the meta
                storedMeta[0] = crumbs;
                storedMeta[1] = routes;
                selector.data("storedMeta", storedMeta); 

                selector.html("");
                var len = crumbs.length - 1;
                selector.append("<span value='-1'>" + configOpts.rootBreadcrumbText + "</span>" + configOpts.pointer + " ");
               
                // Build out the spans for the cumbs
                for (var x=0, cl = crumbs.length - 1; x <= cl; x++)
                {
                    if (x != cl) // Don't append the pointer to the last one in the list
                    {
                        selector.append("<span value='" + routes[x].toString() + "'>" + crumbs[x] + "</span>");
                        selector.append(configOpts.pointer + " ");
                    }
                    else
                    {
                        selector.append("<span class='last' value='" + routes[x].toString() + "'>" + crumbs[x] + "</span>");
                    }
                }

                // If we're too wide, fix the CSS
                if (selector.textWidth() >= selector.width())
                    selector.addClass("overflowText");
                else
                    selector.removeClass("overflowText");

                // Hook up the click event to navigate back
                selector.find("span").not(".last").on("click", function(event) { 

                    // Don't hide the list, we are transitioning in reverse
                    var targetList = container.find(".menuItems");
                    targetList.attr("state", "transitioning");

                    var clickedSpan = $(this);

                    // Going all the way home, just trash it all and rebuild it
                    if (clickedSpan.attr("value") == "-1")
                    {
                        ConfigureMainMenu(container, "transitioning");
                    }
                    else
                    {
                        // Navigating "back", so remove the route & path entries in the meta and they will be rebuilt
                        // within ShowSubmenu below
                        var count = clickedSpan.nextAll("span").length;
                        var splicedCrumbs = new Array();
                        var splicedRoutes = new Array();

                        // Unwind the routes and paths
                        for (var x=0, len = crumbs.length - count; x <= len; x++)
                        {
                            splicedCrumbs.push(crumbs[x]);
                            splicedRoutes.push(routes[x]);
                        }

                        // Update the data
                        storedMeta[0] = splicedCrumbs;
                        storedMeta[1] = splicedRoutes;
                        selector.data("storedMeta", storedMeta); 

                        // Create a dummy list item to pass to ShowSubmenu
                        var submenuLI = $("<li class='menuItem' style='display:none' value='" + clickedSpan.attr("value") + "'></li>");
                        selector.parent().parent().find(".menuItems ul").append(submenuLI);
                        ShowSubmenu(submenuLI, jsonModel.menu, "left");
                   }
                });
            }

            // Used as a utility function to show a set of submenus for a given parent menu
            function ShowSubmenu(li, menu, direction)
            {
                // Get a reference to the value of the clicked item
                var selectedValue = li.attr("value");
                var selector = container.find(".selectorText");

                // Grab the submenus from the json object
                for (var x=0, al = menu.menuitems.length; x < al; x++)
                {
                    var m = menu.menuitems[x];
                    if (m.value == selectedValue)
                    {
                        // Any sub items?
                        if (m.menuitems && m.menuitems.length > 0)
                        {
                            var parentDiv = li.parent().parent();

                            var html = "<ul style='display: none' class='subMenu'>";
                            for (var x=0, al = m.menuitems.length; x < al; x++)
                            {
                                var s = m.menuitems[x];
                                var className = (s.menuitems && s.menuitems.length > 0) ? " hasChildren" : "";
                                html += "<li class='menuItem" + className + "' value='" + s.value + "'>" + s.text + "</li>";
                            }

                            html += "</ul>";
                            
                            var menu = parentDiv.find(".subMenu");
                            var opDir = (direction == "left" ? "right" : "left");

                            if (menu.length > 0)
                            {
                                parentDiv.find(".subMenu").hide("slide", { direction: opDir }, configOpts.slideSpeed, function() { 
                                    menu.remove();
                                    parentDiv.html(html);
                                    parentDiv.find(".subMenu").show("slide", { direction: direction }, configOpts.slideSpeed);
                                    parentDiv.find(".menuItem").on("click", function() { 
                                        ShowSubmenu($(this), m, "right");
                                    });
                                });
                            }
                            else
                            {
                                parentDiv.html(html);
                                parentDiv.find(".subMenu").show("slide", { direction: direction }, configOpts.slideSpeed);

                                // Hook up events
                                parentDiv.find(".menuItem").on("click", function() { 
                                    ShowSubmenu($(this), m, "right");
                                });
                            }
                        }
                        else // Fire the callback event
                        {   
                            // Hide the menu
                            var targetList = container.find(".menuItems");
                            targetList.slideUp(configOpts.slideSpeed);
                            targetList.attr("state", "inactive");
                            selector.attr("state", "inactive");

                            // Fire the callback
                            var callback = configOpts.selectionChanged;
                            if ($.isFunction(callback)) 
                                callback(li);
                        }

                        break;
                    }
                }

                // If configured, show breadcrumbs, otherwise just display the current selection
                if (configOpts.showBreadcrumbs)
                    ShowBreadcrumbs(li, menu);
                else
                {
                    selector.text(li.text());
                }

                // Style it to display the selection
                li.parent().parent().find(".menuItem").removeAttr("selected");
                li.attr("selected", "selected");
            }
        },

        // Use the destroy method to clean up any modifications your widget has made to the DOM
        destroy: function () {
            // Call to the base destructor
            $.Widget.prototype.destroy.call(this);
        }
    });

    // Function to accurately measure the width of a block of text
    $.fn.textWidth = function(){
      var html_org = $(this).html();
      var html_calc = '<span>' + html_org + '</span>';
      $(this).html(html_calc);
      var width = $(this).find('span:first').width();
      $(this).html(html_org);
      return width;
    };
} 

(jQuery));

