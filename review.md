Issues to be fixed:

General

I want proper shadcn date picker for all my dates picker.
I should be a bale to clear all my filters
Anything you do does not have to be backwards compatible, I am just building this out and I can delete data is needed.

Mobile:
Sidebar is too transparent, I should have a solid background
I need my tables to be better mobile optimised, just scrolling is not enough. I will be using this app mostly on mobile.
Or maybe I should be able to click on each items on mobile to view the details for all tables.
The popup form too need some mobile optimisation, no margin on the sides to show it is popup, the button have not space, etc.

1. hook.js:608 Image with src "/logo.png" has either width or height modified, but not the other. If you use CSS to change the size of your image, also include the styles 'width: "auto"' or 'height: "auto"' to maintain the aspect ratio.
2. GET http://localhost:3000/favicon.ico 404 (Not Found)Understand this error

3. My button do not have loaders, login, update, create, form buttons, etc do not have loaders or click states, so I do not know if when they are working when I click them I just see the action, this could lead to multiple clicks I think

Inventory page

1. Deleting an inventory items brings up an alert popup instead of a customer alert like shadcn own. This should be custom and not just any browser alart for everything. Also, nothing shows that anything is deleting but it refreshes on successful delete.
   —— add image
2. No button loader.
3. Uses alert popup
4. The top of the table and the filter are not optimise for mobile, they are just squashed together.

Sewing jobs page

1. I have revenue, collected, profit at the top, I believe I should have remaining too to show how much is left to collect
2. When adding sewing jobs, I should be able to pick fabric from my list of fabrics if I am using my fabric and if it the customer that brought the fabric, then I can type it out. So that it auto handles my sales for me and I won’t need to create a new sales for the sale of the fabric. I can add other things like linning, etc to sales myself later depending on what I use, but at least the fabric should be selectable.
3. What is the function of the measurement reference?
4. Create job button has no loader, noting to show work in progress.
5. I have notes, ets. That are now shown on the table, I should be able to click on the row to see the full details of the job, instead of using the edit button. I should also be able to click on the customer to go to the customer page to see their measurements, instead of manually navigation to customers and searching for that customer.
6. There should also be a check to make sure the fitting date is always before the delivery date.
7. Update button has no loader and the alert popup is what is used too.
8. Mobile: the top of the table could use some cleanup

Expenses page:

1. The filter should be a proper date range picker like of shadcn and not a separate from and to date picker.
2. Add new sale record has error, edit also have errors (check the console)
3. Mobile: the top of the table could use some cleanup

Sales page:

1. Sales type should not have Sewing since it does not have the full dated of what is needed to create a sewing job, sewing job should be created in the sewing page only. Except is you want to auto add sewing job to the sales.
2. The type should contain all the type of items I have in my inventory. Then I should be able to select the particular items I am selling so that sales can be tracked properly.
3. For other type, then I can enter anything.
4. Use proper data range filter of shadcn
5. Record sales button as no ladder and also the update too
   6 Mobile: the top of the table could use some cleanup

Customers page

1. Add button has not loader and update too
2. When I click on a customer, I have 2 sidebars
3. Mobile: the top of the table could use some cleanup
4. Customer detail page need some real mobile optimisation

Receivables

1. No button loader
2. When collect part payment not this page, it does not update the sewing job. Why is this
3. Even when the customers has fully balance, ,it does not adapted the sewing job to reflected the updated payment but customer
4. Mobile table needs help

Collections Log

1. Date range filter should be shadcn
2. Mobile table needs help

Reports page

1. Takes too long to load the reports and the table is not using my skeleton loader
2. Monthly profit bar chat is not handle negative profit well. (Add screenshot)
3. Mobile ned some real optimisation
