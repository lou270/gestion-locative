

export const calculateProrata = (rent: number, charge: number, date: Date, startDate: Date, endDate?: Date | null) => {
    const month = date.getMonth();
    const year = date.getFullYear();

    // Before start
    if (year < startDate.getFullYear() || (year === startDate.getFullYear() && month < startDate.getMonth())) {
        return 0;
    }

    // After end
    if (endDate) {
        if (year > endDate.getFullYear() || (year === endDate.getFullYear() && month > endDate.getMonth())) {
            return 0;
        }
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startDay = 1;
    let endDay = daysInMonth;

    // Entry month
    if (year === startDate.getFullYear() && month === startDate.getMonth()) {
        startDay = startDate.getDate();
    }

    // Exit month
    if (endDate && year === endDate.getFullYear() && month === endDate.getMonth()) {
        endDay = endDate.getDate();
    }

    // Full month
    if (startDay === 1 && endDay === daysInMonth) {
        return rent + charge;
    }

    // Prorata
    const daysOccupied = endDay - startDay + 1;
    if (daysOccupied <= 0) return 0;

    const dailyRate = (rent + charge) / daysInMonth;
    return parseFloat((dailyRate * daysOccupied).toFixed(2));
}

export const calculateTotalDueUntilDate = (rent: number, charge: number, startDate: Date, targetDate: Date, endDate?: Date | null) => {
    let total = 0;

    // Normaliser l'itérateur au 1er du mois de départ
    let iterator = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    // Déterminer la date de fin de calcul (min entre targetDate et endDate)
    let calculationEnd = targetDate;
    if (endDate && endDate < targetDate) {
        calculationEnd = endDate;
    }

    // Fin du mois, pour inclure tout le mois de target/end
    const endTarget = new Date(calculationEnd.getFullYear(), calculationEnd.getMonth() + 1, 0);

    let safety = 0;
    while (iterator <= endTarget) {
        safety++;
        if (safety > 240) break; // Sécurité 20 ans

        total += calculateProrata(rent, charge, iterator, startDate, endDate);

        // Mois suivant
        iterator = new Date(iterator.getFullYear(), iterator.getMonth() + 1, 1);
    }

    return parseFloat(total.toFixed(2));
}
