
const agents = [
  // this is invalid test data but its passed and added to the table, so we need to check for this case
//  {
//     name: '123456',
//     email: 'blr.aravind@example.com',
//     phone: '9101000051',
//     pincode: '560011',
//     aadhaar: '700000000001',
//     pan: 'BLAAA1001A',
//     address: '11 Ashoka Street, Bengaluru',
//     designation: 'Collection Agents'
//   }, 
 {
    name: 'BLR Aravind',
    email: 'blr.aravind@example.com',
    phone: '9101000001',
    pincode: '560011',
    aadhaar: '700000000001',
    pan: 'BLAAA1001A',
    address: '11 Ashoka Street, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Naveen',
    email: 'blr.naveen@example.com',
    phone: '9101000002',
    pincode: '560012',
    aadhaar: '700000000002',
    pan: 'BLAAA1002B',
    address: '22 Richmond Road, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Suresh',
    email: 'blr.suresh@example.com',
    phone: '9101000003',
    pincode: '560013',
    aadhaar: '700000000003',
    pan: 'BLAAA1003C',
    address: '33 Brigade Road, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Kiran',
    email: 'blr.kiran@example.com',
    phone: '9101000004',
    pincode: '560014',
    aadhaar: '700000000004',
    pan: 'BLAAA1004D',
    address: '44 Residency Road, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Praveen',
    email: 'blr.praveen@example.com',
    phone: '9101000005',
    pincode: '560015',
    aadhaar: '700000000005',
    pan: 'BLAAA1005E',
    address: '55 Museum Road, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Raghav',
    email: 'blr.raghav@example.com',
    phone: '9101000006',
    pincode: '560016',
    aadhaar: '700000000006',
    pan: 'BLAAA1006F',
    address: '66 Lavelle Road, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Dinesh',
    email: 'blr.dinesh@example.com',
    phone: '9101000007',
    pincode: '560017',
    aadhaar: '700000000007',
    pan: 'BLAAA1007G',
    address: '77 Cunningham Road, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Manoj',
    email: 'blr.manoj@example.com',
    phone: '9101000008',
    pincode: '560018',
    aadhaar: '700000000008',
    pan: 'BLAAA1008H',
    address: '88 Palace Road, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Vinay',
    email: 'blr.vinay@example.com',
    phone: '9101000009',
    pincode: '560019',
    aadhaar: '700000000009',
    pan: 'BLAAA1009J',
    address: '99 Commercial Street, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Santhosh',
    email: 'blr.santhosh@example.com',
    phone: '9101000010',
    pincode: '560020',
    aadhaar: '700000000010',
    pan: 'BLAAA1010K',
    address: '10 Infantry Road, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Harish',
    email: 'blr.harish@example.com',
    phone: '9101000011',
    pincode: '560021',
    aadhaar: '700000000011',
    pan: 'BLAAA1011L',
    address: '21 Indiranagar Main Road, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Mahesh',
    email: 'blr.mahesh@example.com',
    phone: '9101000012',
    pincode: '560022',
    aadhaar: '700000000012',
    pan: 'BLAAA1012M',
    address: '32 HAL Airport Road, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Ajay',
    email: 'blr.ajay@example.com',
    phone: '9101000013',
    pincode: '560023',
    aadhaar: '700000000013',
    pan: 'BLAAA1013N',
    address: '43 Koramangala 5th Block, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Rahul',
    email: 'blr.rahul@example.com',
    phone: '9101000014',
    pincode: '560024',
    aadhaar: '700000000014',
    pan: 'BLAAA1014P',
    address: '54 Jayanagar 4th Block, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Akash',
    email: 'blr.akash@example.com',
    phone: '9101000015',
    pincode: '560025',
    aadhaar: '700000000015',
    pan: 'BLAAA1015Q',
    address: '65 BTM Layout, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Suraj',
    email: 'blr.suraj@example.com',
    phone: '9101000016',
    pincode: '560026',
    aadhaar: '700000000016',
    pan: 'BLAAA1016R',
    address: '76 HSR Layout, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Deepak',
    email: 'blr.deepak@example.com',
    phone: '9101000017',
    pincode: '560027',
    aadhaar: '700000000017',
    pan: 'BLAAA1017S',
    address: '87 Marathahalli, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Gagan',
    email: 'blr.gagan@example.com',
    phone: '9101000018',
    pincode: '560028',
    aadhaar: '700000000018',
    pan: 'BLAAA1018T',
    address: '98 Whitefield Main Road, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Chetan',
    email: 'blr.chetan@example.com',
    phone: '9101000019',
    pincode: '560029',
    aadhaar: '700000000019',
    pan: 'BLAAA1019U',
    address: '19 Electronic City Phase 1, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Abhishek',
    email: 'blr.abhishek@example.com',
    phone: '9101000020',
    pincode: '560030',
    aadhaar: '700000000020',
    pan: 'BLAAA1020V',
    address: '20 Bannerghatta Road, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Shankar',
    email: 'blr.shankar@example.com',
    phone: '9101000021',
    pincode: '560031',
    aadhaar: '700000000021',
    pan: 'BLAAA1021W',
    address: '31 Basavanagudi, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Ganesh',
    email: 'blr.ganesh@example.com',
    phone: '9101000022',
    pincode: '560032',
    aadhaar: '700000000022',
    pan: 'BLAAA1022X',
    address: '42 Malleshwaram, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Ramesh',
    email: 'blr.ramesh@example.com',
    phone: '9101000023',
    pincode: '560033',
    aadhaar: '700000000023',
    pan: 'BLAAA1023Y',
    address: '53 Rajajinagar, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Lokesh',
    email: 'blr.lokesh@example.com',
    phone: '9101000024',
    pincode: '560034',
    aadhaar: '700000000024',
    pan: 'BLAAA1024Z',
    address: '64 Vijayanagar, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Sandeep',
    email: 'blr.sandeep@example.com',
    phone: '9101000025',
    pincode: '560035',
    aadhaar: '700000000025',
    pan: 'BLAAA1025A',
    address: '75 Yelahanka, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Prakash',
    email: 'blr.prakash@example.com',
    phone: '9101000026',
    pincode: '560036',
    aadhaar: '700000000026',
    pan: 'BLAAA1026B',
    address: '86 Hebbal, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Varun',
    email: 'blr.varun@example.com',
    phone: '9101000027',
    pincode: '560037',
    aadhaar: '700000000027',
    pan: 'BLAAA1027C',
    address: '97 Bellandur, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Nithin',
    email: 'blr.nithin@example.com',
    phone: '9101000028',
    pincode: '560038',
    aadhaar: '700000000028',
    pan: 'BLAAA1028D',
    address: '18 Sarjapur Road, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Tarun',
    email: 'blr.tarun@example.com',
    phone: '9101000029',
    pincode: '560039',
    aadhaar: '700000000029',
    pan: 'BLAAA1029E',
    address: '29 Bommanahalli, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Karthik',
    email: 'blr.karthik@example.com',
    phone: '9101000030',
    pincode: '560040',
    aadhaar: '700000000030',
    pan: 'BLAAA1030F',
    address: '30 Hennur Road, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Pranav',
    email: 'blr.pranav@example.com',
    phone: '9101000031',
    pincode: '560041',
    aadhaar: '700000000031',
    pan: 'BLAAA1031G',
    address: '41 Kalyan Nagar, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Aditya',
    email: 'blr.aditya@example.com',
    phone: '9101000032',
    pincode: '560042',
    aadhaar: '700000000032',
    pan: 'BLAAA1032H',
    address: '52 Frazer Town, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Akhil',
    email: 'blr.akhil@example.com',
    phone: '9101000033',
    pincode: '560043',
    aadhaar: '700000000033',
    pan: 'BLAAA1033J',
    address: '63 Cox Town, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Bharath',
    email: 'blr.bharath@example.com',
    phone: '9101000034',
    pincode: '560044',
    aadhaar: '700000000034',
    pan: 'BLAAA1034K',
    address: '74 Cooke Town, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Darshan',
    email: 'blr.darshan@example.com',
    phone: '9101000035',
    pincode: '560045',
    aadhaar: '700000000035',
    pan: 'BLAAA1035L',
    address: '85 RT Nagar, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Eshwar',
    email: 'blr.eshwar@example.com',
    phone: '9101000036',
    pincode: '560046',
    aadhaar: '700000000036',
    pan: 'BLAAA1036M',
    address: '96 Jakkur, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Farhan',
    email: 'blr.farhan@example.com',
    phone: '9101000037',
    pincode: '560047',
    aadhaar: '700000000037',
    pan: 'BLAAA1037N',
    address: '17 Thanisandra, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Gautam',
    email: 'blr.gautam@example.com',
    phone: '9101000038',
    pincode: '560048',
    aadhaar: '700000000038',
    pan: 'BLAAA1038P',
    address: '28 Kadubeesanahalli, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Hemanth',
    email: 'blr.hemanth@example.com',
    phone: '9101000039',
    pincode: '560049',
    aadhaar: '700000000039',
    pan: 'BLAAA1039Q',
    address: '39 Domlur, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Imran',
    email: 'blr.imran@example.com',
    phone: '9101000040',
    pincode: '560050',
    aadhaar: '700000000040',
    pan: 'BLAAA1040R',
    address: '40 Ulsoor, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Jeevan',
    email: 'blr.jeevan@example.com',
    phone: '9101000041',
    pincode: '560051',
    aadhaar: '700000000041',
    pan: 'BLAAA1041S',
    address: '51 Banaswadi, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Keshav',
    email: 'blr.keshav@example.com',
    phone: '9101000042',
    pincode: '560052',
    aadhaar: '700000000042',
    pan: 'BLAAA1042T',
    address: '62 Kammanahalli, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Lohith',
    email: 'blr.lohith@example.com',
    phone: '9101000043',
    pincode: '560053',
    aadhaar: '700000000043',
    pan: 'BLAAA1043U',
    address: '73 Hoskote Road, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Mithun',
    email: 'blr.mithun@example.com',
    phone: '9101000044',
    pincode: '560054',
    aadhaar: '700000000044',
    pan: 'BLAAA1044V',
    address: '84 Old Airport Road, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Nandan',
    email: 'blr.nandan@example.com',
    phone: '9101000045',
    pincode: '560055',
    aadhaar: '700000000045',
    pan: 'BLAAA1045W',
    address: '95 Brookefield, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Omkar',
    email: 'blr.omkar@example.com',
    phone: '9101000046',
    pincode: '560056',
    aadhaar: '700000000046',
    pan: 'BLAAA1046X',
    address: '16 Kundalahalli, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Pavan',
    email: 'blr.pavan@example.com',
    phone: '9101000047',
    pincode: '560057',
    aadhaar: '700000000047',
    pan: 'BLAAA1047Y',
    address: '27 Varthur Road, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Qadir',
    email: 'blr.qadir@example.com',
    phone: '9101000048',
    pincode: '560058',
    aadhaar: '700000000048',
    pan: 'BLAAA1048Z',
    address: '38 HBR Layout, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Rithvik',
    email: 'blr.rithvik@example.com',
    phone: '9101000049',
    pincode: '560059',
    aadhaar: '700000000049',
    pan: 'BLAAA1049A',
    address: '49 JP Nagar, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Shreyas',
    email: 'blr.shreyas@example.com',
    phone: '9101000050',
    pincode: '560060',
    aadhaar: '700000000050',
    pan: 'BLAAA1050B',
    address: '50 Arekere, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Tejas',
    email: 'blr.tejas@example.com',
    phone: '9101000051',
    pincode: '560061',
    aadhaar: '700000000051',
    pan: 'BLAAA1051C',
    address: '61 Gottigere, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Uday',
    email: 'blr.uday@example.com',
    phone: '9101000052',
    pincode: '560062',
    aadhaar: '700000000052',
    pan: 'BLAAA1052D',
    address: '72 Hulimavu, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Vikas',
    email: 'blr.vikas@example.com',
    phone: '9101000053',
    pincode: '560063',
    aadhaar: '700000000053',
    pan: 'BLAAA1053E',
    address: '83 Kengeri, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Wasim',
    email: 'blr.wasim@example.com',
    phone: '9101000054',
    pincode: '560064',
    aadhaar: '700000000054',
    pan: 'BLAAA1054F',
    address: '94 Nagarbhavi, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Yashwanth',
    email: 'blr.yashwanth@example.com',
    phone: '9101000055',
    pincode: '560065',
    aadhaar: '700000000055',
    pan: 'BLAAA1055G',
    address: '15 Vijayanagar Extension, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Zubin',
    email: 'blr.zubin@example.com',
    phone: '9101000056',
    pincode: '560066',
    aadhaar: '700000000056',
    pan: 'BLAAA1056H',
    address: '26 Peenya, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Anand',
    email: 'blr.anand@example.com',
    phone: '9101000057',
    pincode: '560067',
    aadhaar: '700000000057',
    pan: 'BLAAA1057J',
    address: '37 Yeshwanthpur, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Balaji',
    email: 'blr.balaji@example.com',
    phone: '9101000058',
    pincode: '560068',
    aadhaar: '700000000058',
    pan: 'BLAAA1058K',
    address: '48 Dasarahalli, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Chandru',
    email: 'blr.chandru@example.com',
    phone: '9101000059',
    pincode: '560069',
    aadhaar: '700000000059',
    pan: 'BLAAA1059L',
    address: '59 Magadi Road, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Dhanush',
    email: 'blr.dhanush@example.com',
    phone: '9101000060',
    pincode: '560070',
    aadhaar: '700000000060',
    pan: 'BLAAA1060M',
    address: '60 Mysore Road, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Eknath',
    email: 'blr.eknath@example.com',
    phone: '9101000061',
    pincode: '560071',
    aadhaar: '700000000061',
    pan: 'BLAAA1061N',
    address: '71 Kothanur, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Feroz',
    email: 'blr.feroz@example.com',
    phone: '9101000062',
    pincode: '560072',
    aadhaar: '700000000062',
    pan: 'BLAAA1062P',
    address: '82 Anjanapura, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Girish',
    email: 'blr.girish@example.com',
    phone: '9101000063',
    pincode: '560073',
    aadhaar: '700000000063',
    pan: 'BLAAA1063Q',
    address: '93 Uttarahalli, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Hitesh',
    email: 'blr.hitesh@example.com',
    phone: '9101000064',
    pincode: '560074',
    aadhaar: '700000000064',
    pan: 'BLAAA1064R',
    address: '14 Begur Road, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Ishaan',
    email: 'blr.ishaan@example.com',
    phone: '9101000065',
    pincode: '560075',
    aadhaar: '700000000065',
    pan: 'BLAAA1065S',
    address: '25 Kanakapura Road, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Jagadeesh',
    email: 'blr.jagadeesh@example.com',
    phone: '9101000066',
    pincode: '560076',
    aadhaar: '700000000066',
    pan: 'BLAAA1066T',
    address: '36 Hosa Road, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Kishore',
    email: 'blr.kishore@example.com',
    phone: '9101000067',
    pincode: '560077',
    aadhaar: '700000000067',
    pan: 'BLAAA1067U',
    address: '47 Kudlu Gate, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Madhav',
    email: 'blr.madhav@example.com',
    phone: '9101000068',
    pincode: '560078',
    aadhaar: '700000000068',
    pan: 'BLAAA1068V',
    address: '58 Begur Lake Road, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Nikhil',
    email: 'blr.nikhil@example.com',
    phone: '9101000069',
    pincode: '560079',
    aadhaar: '700000000069',
    pan: 'BLAAA1069W',
    address: '69 Akshayanagar, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Ojas',
    email: 'blr.ojas@example.com',
    phone: '9101000070',
    pincode: '560080',
    aadhaar: '700000000070',
    pan: 'BLAAA1070X',
    address: '70 Konanakunte, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Prithvi',
    email: 'blr.prithvi@example.com',
    phone: '9101000071',
    pincode: '560081',
    aadhaar: '700000000071',
    pan: 'BLAAA1071Y',
    address: '81 Kumaraswamy Layout, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Rohan',
    email: 'blr.rohan@example.com',
    phone: '9101000072',
    pincode: '560082',
    aadhaar: '700000000072',
    pan: 'BLAAA1072Z',
    address: '92 Banashankari, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Sagar',
    email: 'blr.sagar@example.com',
    phone: '9101000073',
    pincode: '560083',
    aadhaar: '700000000073',
    pan: 'BLAAA1073A',
    address: '13 Kathriguppe, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Tushar',
    email: 'blr.tushar@example.com',
    phone: '9101000074',
    pincode: '560084',
    aadhaar: '700000000074',
    pan: 'BLAAA1074B',
    address: '24 Padmanabhanagar, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Umesh',
    email: 'blr.umesh@example.com',
    phone: '9101000075',
    pincode: '560085',
    aadhaar: '700000000075',
    pan: 'BLAAA1075C',
    address: '35 Kumaraswamy Layout, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Vishal',
    email: 'blr.vishal@example.com',
    phone: '9101000076',
    pincode: '560086',
    aadhaar: '700000000076',
    pan: 'BLAAA1076D',
    address: '46 Chandra Layout, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Akshay',
    email: 'blr.akshay@example.com',
    phone: '9101000077',
    pincode: '560087',
    aadhaar: '700000000077',
    pan: 'BLAAA1077E',
    address: '57 Attiguppe, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Bhavesh',
    email: 'blr.bhavesh@example.com',
    phone: '9101000078',
    pincode: '560088',
    aadhaar: '700000000078',
    pan: 'BLAAA1078F',
    address: '68 RPC Layout, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Chirag',
    email: 'blr.chirag@example.com',
    phone: '9101000079',
    pincode: '560089',
    aadhaar: '700000000079',
    pan: 'BLAAA1079G',
    address: '79 Vijayanagar 2nd Stage, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Devraj',
    email: 'blr.devraj@example.com',
    phone: '9101000080',
    pincode: '560090',
    aadhaar: '700000000080',
    pan: 'BLAAA1080H',
    address: '80 Nagarbhavi 2nd Stage, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Eshanth',
    email: 'blr.eshanth@example.com',
    phone: '9101000081',
    pincode: '560091',
    aadhaar: '700000000081',
    pan: 'BLAAA1081J',
    address: '91 Jalahalli, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Faizal',
    email: 'blr.faizal@example.com',
    phone: '9101000082',
    pincode: '560092',
    aadhaar: '700000000082',
    pan: 'BLAAA1082K',
    address: '12 Mathikere, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Gautham',
    email: 'blr.gautham@example.com',
    phone: '9101000083',
    pincode: '560093',
    aadhaar: '700000000083',
    pan: 'BLAAA1083L',
    address: '23 Sanjaynagar, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Hrithik',
    email: 'blr.hrithik@example.com',
    phone: '9101000084',
    pincode: '560094',
    aadhaar: '700000000084',
    pan: 'BLAAA1084M',
    address: '34 RMV Extension, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Indrajith',
    email: 'blr.indrajith@example.com',
    phone: '9101000085',
    pincode: '560095',
    aadhaar: '700000000085',
    pan: 'BLAAA1085N',
    address: '45 Dollars Colony, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Jayant',
    email: 'blr.jayant@example.com',
    phone: '9101000086',
    pincode: '560096',
    aadhaar: '700000000086',
    pan: 'BLAAA1086P',
    address: '56 Nagawara, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Kunal',
    email: 'blr.kunal@example.com',
    phone: '9101000087',
    pincode: '560097',
    aadhaar: '700000000087',
    pan: 'BLAAA1087Q',
    address: '67 Thanisandra Main Road, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Lakshman',
    email: 'blr.lakshman@example.com',
    phone: '9101000088',
    pincode: '560098',
    aadhaar: '700000000088',
    pan: 'BLAAA1088R',
    address: '78 Hegde Nagar, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Mohan',
    email: 'blr.mohan@example.com',
    phone: '9101000089',
    pincode: '560099',
    aadhaar: '700000000089',
    pan: 'BLAAA1089S',
    address: '89 Jakkur Layout, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Naveed',
    email: 'blr.naveed@example.com',
    phone: '9101000090',
    pincode: '560100',
    aadhaar: '700000000090',
    pan: 'BLAAA1090T',
    address: '90 Yelahanka New Town, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Omesh',
    email: 'blr.omesh@example.com',
    phone: '9101000091',
    pincode: '560101',
    aadhaar: '700000000091',
    pan: 'BLAAA1091U',
    address: '11 Devanahalli Road, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Pranesh',
    email: 'blr.pranesh@example.com',
    phone: '9101000092',
    pincode: '560102',
    aadhaar: '700000000092',
    pan: 'BLAAA1092V',
    address: '22 Hoskote Main Road, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Rishabh',
    email: 'blr.rishabh@example.com',
    phone: '9101000093',
    pincode: '560103',
    aadhaar: '700000000093',
    pan: 'BLAAA1093W',
    address: '33 KR Puram, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Sumanth',
    email: 'blr.sumanth@example.com',
    phone: '9101000094',
    pincode: '560104',
    aadhaar: '700000000094',
    pan: 'BLAAA1094X',
    address: '44 Mahadevapura, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Tanmay',
    email: 'blr.tanmay@example.com',
    phone: '9101000095',
    pincode: '560105',
    aadhaar: '700000000095',
    pan: 'BLAAA1095Y',
    address: '55 Hoodi, Bengaluru',
    designation: 'General Manager'
  },
  {
    name: 'BLR Ujwal',
    email: 'blr.ujwal@example.com',
    phone: '9101000096',
    pincode: '560106',
    aadhaar: '700000000096',
    pan: 'BLAAA1096Z',
    address: '66 Kadugodi, Bengaluru',
    designation: 'Collection Agents'
  },
  {
    name: 'BLR Vedant',
    email: 'blr.vedant@example.com',
    phone: '9101000097',
    pincode: '560107',
    aadhaar: '700000000097',
    pan: 'BLAAA1097A',
    address: '77 Channasandra, Bengaluru',
    designation: 'Business Agent'
  },
  {
    name: 'BLR Yatin',
    email: 'blr.yatin@example.com',
    phone: '9101000098',
    pincode: '560108',
    aadhaar: '700000000098',
    pan: 'BLAAA1098B',
    address: '88 Ramamurthy Nagar, Bengaluru',
    designation: 'Sales Manager'
  },
  {
    name: 'BLR Zayan',
    email: 'blr.zayan@example.com',
    phone: '9101000099',
    pincode: '560109',
    aadhaar: '700000000099',
    pan: 'BLAAA1099C',
    address: '99 Horamavu, Bengaluru',
    designation: 'Full Stack Developer'
  },
  {
    name: 'BLR Abhinav',
    email: 'blr.abhinav@example.com',
    phone: '9101000100',
    pincode: '560110',
    aadhaar: '700000000100',
    pan: 'BLAAA1100D',
    address: '100 Kaggadasapura, Bengaluru',
    designation: 'General Manager'
  }
];

module.exports = agents;
