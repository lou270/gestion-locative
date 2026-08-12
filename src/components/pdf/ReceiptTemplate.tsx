import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { buildReceiptDeclaration, euros, frDate, landlordName, madeAt } from './format';
import type { PdfLandlord, PdfProperty } from './types';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 12,
        fontFamily: 'Helvetica',
    },
    title: {
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    header: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    section: {
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    bold: {
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
    },
    footer: {
        marginTop: 40,
        textAlign: 'center',
        fontSize: 10,
        color: 'gray',
    },
});

interface ReceiptProps {
    tenant: {
        firstName: string;
        lastName: string;
        address: string;
        postalCode: string;
        city: string;
        startDate: Date;
        property?: PdfProperty | null;
    };
    landlord?: PdfLandlord | null;
    period: {
        start: Date;
        end: Date;
    };
    amount: {
        rent: number;
        charge: number;
        total: number;
        caf?: number;
    };
    /** Date du dernier encaissement imputé à la période. */
    paymentDate: Date;
    date: Date;
}

export const ReceiptDocument = ({
    tenant,
    landlord,
    period,
    amount,
    paymentDate,
    date,
}: ReceiptProps) => {
    const cafAmount = amount.caf && amount.caf > 0 ? amount.caf : 0;
    const paidByTenant = amount.total - cafAmount;
    const bailleur = landlordName(landlord) || 'le bailleur';
    const locataire = `${tenant.firstName} ${tenant.lastName}`;
    const logement = tenant.property
        ? `${tenant.property.name} — ${tenant.property.address}, ${tenant.property.postalCode} ${tenant.property.city}`
        : `${tenant.address}, ${tenant.postalCode} ${tenant.city}`;

    // La phrase est assemblée en amont plutôt qu'au fil du JSX : une expression
    // `{}` précédée d'un retour à la ligne perd l'espace qui la sépare du
    // texte, ce qui collait les mots à l'impression.
    const declaration = buildReceiptDeclaration({
        bailleur,
        locataire,
        paidByTenant,
        cafAmount,
        period,
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>QUITTANCE DE LOYER</Text>

                <View style={styles.header}>
                    <View>
                        <Text style={styles.bold}>BAILLEUR</Text>
                        <Text>{bailleur}</Text>
                        {landlord?.address ? <Text>{landlord.address}</Text> : null}
                        {landlord?.postalCode && landlord?.city ? (
                            <Text>{`${landlord.postalCode} ${landlord.city}`}</Text>
                        ) : null}
                        {landlord?.email ? <Text>{landlord.email}</Text> : null}
                        {landlord?.siret ? (
                            <Text style={{ fontSize: 9, marginTop: 2 }}>{`SIRET : ${landlord.siret}`}</Text>
                        ) : null}
                    </View>
                    <View>
                        <Text style={styles.bold}>LOCATAIRE</Text>
                        <Text>{locataire}</Text>
                        <Text>{tenant.address}</Text>
                        <Text>{`${tenant.postalCode} ${tenant.city}`}</Text>
                        <Text style={{ fontSize: 10, marginTop: 5, color: '#444' }}>
                            {`Entrée dans les lieux le ${frDate(tenant.startDate)}`}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text>
                        <Text style={styles.bold}>Logement loué : </Text>
                        <Text>{logement}</Text>
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text>
                        <Text style={styles.bold}>Période : </Text>
                        <Text>{`du ${frDate(period.start)} au ${frDate(period.end)}`}</Text>
                    </Text>
                </View>

                <View
                    style={{
                        marginTop: 20,
                        marginBottom: 20,
                        borderTop: 1,
                        borderBottom: 1,
                        paddingRight: 10,
                    }}
                >
                    {/* Le détail loyer / charges est exigé par l'article 21 de la
                        loi du 6 juillet 1989 : la quittance doit distinguer les deux. */}
                    <View style={[styles.row, { marginTop: 10 }]}>
                        <Text>Loyer hors charges</Text>
                        <Text>{euros(amount.rent)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>Provision pour charges</Text>
                        <Text>{euros(amount.charge)}</Text>
                    </View>
                    <View style={[styles.row, { marginTop: 6, borderTop: 1, paddingTop: 5 }]}>
                        <Text style={styles.bold}>TOTAL DE LA QUITTANCE</Text>
                        <Text style={styles.bold}>{euros(amount.total)}</Text>
                    </View>

                    {cafAmount > 0 ? (
                        <>
                            <View style={[styles.row, { marginTop: 6 }]}>
                                <Text>dont allocation logement versée par la CAF</Text>
                                <Text>{euros(cafAmount)}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text>dont réglé par le locataire</Text>
                                <Text>{euros(paidByTenant)}</Text>
                            </View>
                        </>
                    ) : null}
                </View>

                <View style={styles.section}>
                    <Text>{declaration}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={{ fontSize: 11, color: '#444' }}>
                        {`Paiement reçu le ${frDate(paymentDate)}.`}
                    </Text>
                </View>

                <View style={{ marginTop: 25 }}>
                    <Text>{madeAt(landlord?.city, date)}</Text>
                    <Text style={{ marginTop: 25 }}>{`Signature du bailleur — ${bailleur}`}</Text>
                </View>

                <Text style={styles.footer}>
                    Cette quittance annule tous les reçus qui auraient pu être donnés pour acompte
                    versé sur le présent terme.
                </Text>
            </Page>
        </Document>
    );
};
