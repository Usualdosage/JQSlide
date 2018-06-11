Converts a hierarchical JSON object into an animated "iPhone style" slider list

Usage: $('#slideList').slideList({ selectionChanged: function(item) { alert('Selection changed!')  } });

When an item (not a sub menu) is selected, the selectionChanged event is raised and an LI like the following is returned: <li class=​"menuItem" value=​"3">​Sub Sub Item 1​</li>​.

View the sample.html file for a working example.

Sample Input Data:
{
 "menu": {
     "menuitems": [
         {
             "text": "Parent Item 1",
             "value": "1",
             "menuitems": [
                 {
                     "text": "Sub Item 1",
                     "value": "2",
                     "menuitems": [
                     {
                         "text": "Sub Sub Item 1",
                         "value": "3",
                         // etc, etc
                     }
                 }
             ]
         }
     }
 }