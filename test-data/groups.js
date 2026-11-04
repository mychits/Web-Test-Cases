module.exports = [
  {
    groupName: `QA-AUTO-GROUP-${Date.now()}`,
    groupType: 'Dividend Group',
    relationshipManager: '', // Set a valid RM from your application

    vacancySeat: '2',
    groupValue: '100000',
    groupInstallment: '5000',
    groupMembers: '20',

    dailyInstallment: '167',
    weeklyInstallment: '1167',
    monthlyInstallment: '5000',

    groupDuration: '20',
    registrationFee: '500',

    startDateType: 'Fixed',
    startDate: '2026-12-01',
    endDate: '2028-07-01',

    minimumBid: '5',
    maximumBid: '30',

    agentCommission: '1',
    companyCommission: '5',
    employeeIncentives: '1',

    auctionProcessingType: 'SYSTEM',
    auctionMode: 'ONLINE'
  }
];
