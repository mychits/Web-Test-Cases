
module.exports = [
  {
    testId: "TC001",
    scenario: "Branch Creation - Field Validation",

    // BASIC INFORMATION
    branchName: "12345678",
    branchType: "Branch",
    status: "Active",
    isHeadOffice: "No",
    openingDate: "2026-11-17",

    // CONTACT INFORMATION
    phoneNumber: "8148792313",
    emailAddress: "emp2.chitxpert@gmail.com",

    // ADDRESS INFORMATION
    streetAddress1: "btm layout",
    streetAddress2: "Bengaluru",
    city: "Btm layout",
    district: "Bengaluru",
    state: "karnataka",
    country: "India",
    pincode: "560029",

    // MANAGER INFORMATION
    managerName: "12345",
    managerPhone: "hariaran",

    // TAX INFORMATION
    gstNumber: "asf",
    panNumber: "hariaran"
  }
]
// const validData = {
//   branchName: "QA Test Branch",
//   branchType: "Branch",
//   status: "Active",
//   isHeadOffice: "No",
//   openingDate: "2026-11-17",

//   phoneNumber: "9876543210",
//   emailAddress: "qatest@example.com",

//   streetAddress1: "BTM Layout",
//   streetAddress2: "2nd Stage",
//   city: "Bengaluru",
//   district: "Bengaluru",
//   state: "Karnataka",
//   country: "India",
//   pincode: "560029",

//   managerName: "Arun Kumar",
//   managerPhone: "9876543210",

//   gstNumber: "29ABCDE1234F1Z5",
//   panNumber: "ABCDE1234F"
// };

// // Helper to generate each test dataset.
// // All fields remain valid-looking except the field under test.
// function createData(testId, scenario, changes = {}) {
//   return {
//     testId,
//     scenario,
//     ...validData,
//     branchName: `QA-BR-${testId}-${Date.now()}`,
//     ...changes
//   };
// }

// const branches = [
//   // =====================================
//   // TC001 - ORIGINAL INVALID DATA
//   // =====================================
//   createData(
//     "TC001",
//     "Multiple Invalid Fields",
//     {
//       branchName: "12345678",
//       phoneNumber: "8148792313",
//       emailAddress: "emp2.chitxpert@gmail.com",
//       streetAddress1: "btm layout",
//       streetAddress2: "Bengaluru",
//       city: "Btm layout",
//       district: "Bengaluru",
//       state: "karnataka",
//       managerName: "12345",
//       managerPhone: "hariaran",
//       gstNumber: "asf",
//       panNumber: "hariaran"
//     }
//   ),

//   // =====================================
//   // BRANCH NAME VALIDATION
//   // =====================================
//   createData("TC002", "Empty Branch Name", {
//     branchName: ""
//   }),

//   createData("TC003", "Numeric Branch Name", {
//     branchName: "12345678"
//   }),

//   createData("TC004", "Special Characters in Branch Name", {
//     branchName: "@#$%^&*"
//   }),

//   createData("TC005", "Single Character Branch Name", {
//     branchName: "A"
//   }),

//   createData("TC006", "Very Long Branch Name", {
//     branchName: "A".repeat(100)
//   }),

//   createData("TC007", "Duplicate Branch Name", {
//     // Replace with a branch name that already exists.
//     branchName: "EXISTING_BRANCH_NAME"
//   }),

//   // =====================================
//   // MANAGER NAME VALIDATION
//   // =====================================
//   createData("TC008", "Empty Manager Name", {
//     managerName: ""
//   }),

//   createData("TC009", "Numeric Manager Name", {
//     managerName: "12345"
//   }),

//   createData("TC010", "Special Characters in Manager Name", {
//     managerName: "@#$%"
//   }),

//   // =====================================
//   // MANAGER PHONE VALIDATION
//   // =====================================
//   createData("TC011", "Alphabetic Manager Phone", {
//     managerPhone: "hariaran"
//   }),

//   createData("TC012", "Short Manager Phone", {
//     managerPhone: "12345"
//   }),

//   createData("TC013", "Long Manager Phone", {
//     managerPhone: "987654321012345"
//   }),

//   createData("TC014", "Empty Manager Phone", {
//     managerPhone: ""
//   }),

//   // =====================================
//   // GST NUMBER VALIDATION
//   // =====================================
//   createData("TC015", "Invalid GST Number", {
//     gstNumber: "asf"
//   }),

//   createData("TC016", "Numeric GST Number", {
//     gstNumber: "123456789012345"
//   }),

//   createData("TC017", "Special Characters in GST Number", {
//     gstNumber: "@#$%^&"
//   }),

//   createData("TC018", "Short GST Number", {
//     gstNumber: "123"
//   }),

//   // =====================================
//   // PAN NUMBER VALIDATION
//   // =====================================
//   createData("TC019", "Alphabetic PAN Number", {
//     panNumber: "hariaran"
//   }),

//   createData("TC020", "Numeric PAN Number", {
//     panNumber: "1234567890"
//   }),

//   createData("TC021", "Short PAN Number", {
//     panNumber: "ABC12"
//   }),

//   createData("TC022", "Special Characters in PAN Number", {
//     panNumber: "@#$%^&"
//   }),

//   // =====================================
//   // EMAIL VALIDATION
//   // =====================================
//   createData("TC023", "Invalid Email Format", {
//     emailAddress: "invalidemail"
//   }),

//   createData("TC024", "Email Missing Domain", {
//     emailAddress: "test@"
//   }),

//   // =====================================
//   // CONTACT PHONE VALIDATION
//   // =====================================
//   createData("TC025", "Alphabetic Phone Number", {
//     phoneNumber: "abcdefghij"
//   }),

//   createData("TC026", "Short Phone Number", {
//     phoneNumber: "12345"
//   }),

//   // =====================================
//   // PINCODE VALIDATION
//   // =====================================
//   createData("TC027", "Alphabetic Pincode", {
//     pincode: "abcdef"
//   }),

//   createData("TC028", "Invalid Pincode Length", {
//     pincode: "123"
//   }),

//   // =====================================
//   // ADDRESS VALIDATION
//   // =====================================
//   createData("TC029", "Empty Street Address Line 1", {
//     streetAddress1: ""
//   }),

//   // =====================================
//   // POSITIVE TEST
//   // =====================================
//   createData("TC030", "Valid Branch Creation", {
//     branchName: `QA-VALID-${Date.now()}`
//   })
// ];

// module.exports = branches;

