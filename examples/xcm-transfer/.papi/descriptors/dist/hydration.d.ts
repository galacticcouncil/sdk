import {
  StorageDescriptor,
  PlainDescriptor,
  TxDescriptor,
  RuntimeDescriptor,
  Enum,
  QueryFromPalletsDef,
  TxFromPalletsDef,
  EventsFromPalletsDef,
  ErrorsFromPalletsDef,
  ConstFromPalletsDef,
  SS58String,
  FixedSizeBinary,
  Binary,
  FixedSizeArray,
} from 'polkadot-api';
import {
  I5sesotjlssv2d,
  Iffmde3ekjedi9,
  I4mddgoa69c0a2,
  I86ve4guev2c9,
  I95g6i7ilua7lq,
  Ieniouoqkq4icf,
  Phase,
  Ibgl04rn6nbfm6,
  I1q8tnt1cluu5j,
  I8ds64oj6581v0,
  Ia7pdug7cdsg8g,
  I3oiqtmlj7klbr,
  I9bin2jc70qt6q,
  TransactionPaymentReleases,
  Iegmj7n48sc3am,
  Icgljjb6j82uhn,
  Ie9j1itogtv7p5,
  PreimageOldRequestStatus,
  PreimageRequestStatus,
  I4pact7n2e9a0i,
  I1evsr8hplu1lg,
  I910puuahutflf,
  I4nfjdef0ibh44,
  I74af64m08r6as,
  I9bhbof2vim227,
  I6ouflveob4eli,
  I6mhebgj62g585,
  I3vhcedhm4hpvm,
  I526daka7j7b17,
  Ifanv2kvm586s4,
  I5rsgtofmn5lli,
  Idned7t7knml6b,
  I2itl2k1j2q8nf,
  I8nj9dlo7lnbb3,
  Iba9inugg1atvo,
  Ib23vkkc52tqbu,
  Ic5m5lp1oioo8r,
  I3334u30i909c2,
  I99bb69usss9gs,
  Ia2lhg7l2hilo3,
  I8fkfedbgu1sn3,
  Iegjdtqhbb6qh9,
  I9p9lq3rej5bhc,
  Iag146hmjgqfgj,
  I8uo3fpd3bcc6f,
  Ianufjuplcj6u4,
  Ic3orq32is6lrl,
  I95l2k9b1re95f,
  I2mv9dvsaj3kcr,
  I200n1ov5tbcvr,
  I7781vnk0rm9eq,
  Ie2iqtdb0stqo1,
  I974uplh4fafs4,
  Ic9nev69d8grv1,
  If354jrdedj0pj,
  Ib17t3992hb64n,
  I215mkl885p4da,
  ConvictionVotingVoteVoting,
  If9jidduiuq7vv,
  I7l9ov6gsk96cm,
  Ifj0li5nn5unet,
  I4c0s5cioidn76,
  Isibf8mrredhc,
  I8ikpj86u2na1q,
  I23jd67h2erm49,
  Icbsch55a85u5u,
  Idkbvh6dahk1v7,
  I5ugnv0dol8v8t,
  I1ksaufim9dq1c,
  Ielgh4t8o7rcvt,
  I3rvqhkck00laj,
  I9jd27rnpm8ttv,
  I7bcpl5g2rcql5,
  I4vdvk2616mp4t,
  Iep7au1720bm0e,
  I48olja7kd2ijk,
  I4q0p5rehstne,
  Iesal24fi7slt9,
  I4kv0johj9i346,
  Ibn3i0ad6beo5l,
  I10uqvdcdcld3o,
  I3fgr93o42d9hi,
  Ihjc2vmjfhsmq,
  I663kh18bno0fo,
  I1p5pqg6bllgtl,
  I4ojmnsk1dchql,
  Iesq88051ch8ht,
  I9qpa0evftgoo5,
  I4qc61lpfqml75,
  I1stghsu756nk9,
  Ic02kut0350gb0,
  I199nnq793ql30,
  I7jidl7qnnq87c,
  I82cps8ng2jtug,
  Ic17drnrq0rtgi,
  Idi27giun0mb9q,
  Idud3fdh64aqp9,
  Ie7atdsih6q14b,
  I4totqt881mlti,
  Id32h28hjj1tch,
  I66gvo4ilpv28i,
  I2u0nucph7peo9,
  Id2tibj9h7evc8,
  I56u24ncejr5kt,
  I1v7jbnil3tjns,
  I8jgj1nhcr2dg8,
  Ifn6q3equiq9qi,
  Ia3sb0vgvovhtg,
  Iav8k1edbj86k7,
  Itom7fk49o0c9,
  I4i91h98n3cv1b,
  I4iumukclgj8ej,
  Iqnbvitf7a7l3,
  I6r5cbv8ttrb09,
  I4q39t5hn830vp,
  XcmPalletQueryStatus,
  Ic4qvh5df9s5gp,
  I7vlvrrl2pnbgk,
  I50sjs3s5lud21,
  XcmPalletVersionMigrationStage,
  I50qp0ij7h62g2,
  Iteuj23is2ed5,
  I3rp19gb4dadaa,
  Ib77b0fp1a6mjr,
  I5g2vv0ckl2m8b,
  Ifup3lg9ro8a0f,
  Idh2ug6ou4a8og,
  Iejeo53sea6n4q,
  I53esa2ms463bk,
  Ib4jhb8tt3uung,
  Id0as9l3s817qs,
  Ifmurjhsco5svb,
  Ifi4da1gej1fri,
  Ifvgo9568rpmqc,
  I82jm9g7pufuel,
  I6cs1itejju2vv,
  I7dp637m60bg7s,
  Ifmar1ir5rft6l,
  I1os9h4ivict7u,
  Isa48262v9oqu,
  I7k4nkfs24tj3,
  In7a38730s6qs,
  If15el53dd76v9,
  I9s0ave7t0vnrk,
  Ic6nglu2db2c36,
  I35p85j063s0il,
  Ibafpkl9hhno69,
  I9m0752cdvui5o,
  Ie5fbn0f5capo3,
  Ia9ai1mp1viqjd,
  Ie4gu6f3b6uctq,
  Iasb8k6ash5mjn,
  I8ofcg5rbj0g2c,
  I4adgbll7gku4i,
  I6pjjpfvhvcfru,
  I9pj91mj79qekl,
  I39uah9nss64h9,
  Ik64dknsq7k08,
  Ib51vk42m1po4n,
  Idcr6u6361oad9,
  I1o12ibtjm10ot,
  I8vn14j8a40qm,
  I493o732nahjlr,
  Id5fm4p8lj5qgi,
  Ibmr18suc9ikh9,
  I4og34pg4ruv5d,
  I5u8olqbbvfnvf,
  Ic1e6uvbf8ado3,
  Ie7oqvfdar8r2,
  I6v8sm60vvkmk7,
  I92pum5p0t4pat,
  I1g5tojdtkn6tu,
  Icm9m0qeemu66d,
  Idscf6boak49q1,
  I6qq5nnbjegi8u,
  I666bl2fqjkejo,
  Ibvmpv5kha43st,
  Ic30ooaln1e62m,
  Ifc9cjhms1f6t5,
  I21uv2pp95ebqd,
  I82nfqfkd48n10,
  I1jm8m1rh9e20v,
  I3o5j3bli1pd8e,
  Icbccs0ug47ilf,
  I2kds5jji7slh8,
  Ia9mkdf6l44shb,
  I9l2s4klu0831o,
  I2ctrt5nqb8o7c,
  I711qahikocb1c,
  I93c18nim2s66c,
  Id6gojh30v9ib2,
  Ica5n28rlj0lk6,
  I14p0q0qs0fqbj,
  Ie3u4phm019a8l,
  I9jie72r7q6717,
  I3alo542n0mgp,
  I2rg5btjrsqec0,
  I21r37il499a97,
  Ie5l999tf7t2te,
  I1moso5oagpiea,
  Ibeb4n9vpjefp3,
  Id7murq9s9fg6h,
  Ied9mja4bq7va8,
  I4f7jul8ljs54r,
  I5agg650597e49,
  I2ev73t79f46tb,
  Iab64mce6q91i,
  I7ji3jng252el9,
  I3v9h9f3mpm1l8,
  I9mnj4k4u8ls2c,
  I2kt2u1flctk2q,
  Iaa13icjlsj13d,
  I98vh5ccjtf1ev,
  I3al0eab2u0gt2,
  I7hhej9ji2h5gt,
  I6fuug4i4r04hi,
  I38jfk5li8iang,
  If6o6gqb6cajtb,
  Iehb3squnhooig,
  I2dtrijkm5601t,
  Ib2obgji960euh,
  Ie6dn4p5chsk1u,
  I2vi5dr4528rgv,
  I1pm30k3i4438u,
  Igd9530gfdrn3,
  I2e1ekg17a2uj2,
  I9uff8o8g5b5av,
  I1acluqiqlacck,
  Idkqesere66fs7,
  Ifs54vj2idl9k4,
  Id0r8q2e0it0cs,
  I8545phbh5off1,
  I5dr8mcko4nff,
  Ideaemvoneh309,
  I3d9o9d7epp66v,
  I3rrsthr03bsf8,
  I1it6nfuocs3uo,
  I83qeclck631s2,
  I846j8gk91gp4q,
  I4apbr3d7b110l,
  I9svbf1ionsuba,
  I63enm20toa64c,
  I92ucef7ff2o7l,
  I88sl1jplq27bh,
  I2970lus2v0qct,
  I1vsbo63n9pu69,
  I3fatc2oi4mp63,
  I1j3v9uknthnij,
  I6ng2cdk1vvip6,
  I62ht2i39rtkaa,
  Ichf8eu9t3dtc2,
  I9e4bfe80t2int,
  I9oai3q0an1tbo,
  I90ivo9n6p6nqo,
  Idj9k8sn80h3m6,
  I64f3h3tf92u6f,
  Ifnmu9mlmgtdbf,
  I7psec5e6ghc64,
  I2psb0sladd863,
  I585tk8khua0gk,
  I3ut99di214ru2,
  Iemkp87d26vsbh,
  I4ahfrt5dscf6q,
  Idnsr2pndm36h0,
  Itcpv4hqecjfj,
  I8steo882k7qns,
  I9qtj66dgng975,
  I5f178ab6b89t3,
  Iduerupfbc8ruc,
  I1q9ffekvj417t,
  Icbio0e1f0034b,
  I8c0vkqjjipnuj,
  I1adbcfi5uc62r,
  Ibf6ucefn8fh49,
  I6p92qik9qvgb2,
  Iejcu4gr9du24t,
  I9hlpdu483dt8k,
  I4a8hon12idk34,
  Ia5le7udkgbaq9,
  Ib2p3kr78drjc1,
  Ida2ijjar0n0j3,
  Ing3etrevsfg0,
  Ietsl92b11kilg,
  Icqdi7b9m95ug3,
  Ieuqv44kptstcs,
  I6vhvcln14dp4d,
  Ievca65alkkho9,
  I2qkf9i0e8mf1f,
  Iefviakco48cs2,
  Iakb7idgif10m8,
  Id7aqsj1u6b2r2,
  Icah19jgge5j3e,
  I2bi2kbaaunr13,
  Ian208gj7nqkdo,
  I81d44muu393rf,
  I3iojc1k1m6nu7,
  I9q8qmop6bko5m,
  Ial2ta95n8ff3b,
  Iammrvujtc5lnk,
  I87j02rt3f17j8,
  Iasmn3c065hq91,
  Ia5kd7m19ap7ge,
  Ieq7brqoubndin,
  Ie8ft8rd6cil27,
  I2k37dcoppgins,
  Ia05t9pjenemsb,
  I4rm8rabbdt645,
  I9sh4kg79d0vn,
  I5k5ne4orot4oe,
  Idtg418thlu95,
  I8utns9aeu3t6o,
  I35cf63e7kg5on,
  Ibq6b0nsk23kj8,
  I2i1tilmsb1rl1,
  I4l0u1h71fhj81,
  Iet9su1uri0qgo,
  I242odhgbhik24,
  I7o081p6vv5gqs,
  Ic18k1k8u5726n,
  I3qt1hgg4djhgb,
  I77a9b6eik0rui,
  Ics8sn0t3vlpat,
  I6p5nbogrodkcc,
  I7pgj3rnfo83eg,
  Ic11mlh16sngai,
  I4vbsn8c7ui70f,
  I60m5cjc6e18ab,
  Iauknf9up388mv,
  Ieh252ua9757u1,
  Iest0fomljvrb6,
  I2d6orhhgh5et2,
  I3i06ijrvdoq97,
  Ibc2f5cr6dqguj,
  Ia6sgngioc9e,
  I3qhjmr9i9etho,
  I13ss7bvftqcnq,
  Ic3gahhrcopfnt,
  I9n7ns8k72amhv,
  I2co61imvsepb6,
  Icjk91npopm3h9,
  Ie03o0h06lol9p,
  Ie6ot1bq9o2jef,
  I6ap0qjh5n5817,
  Ionfhf9va2t31,
  I2j52g067ah8dm,
  Ics51ctc9oasbt,
  Ibbvcet1pv1l61,
  I67bpqa7o2ocua,
  I2holodggoluon,
  Ib5umq5uf644jr,
  I9r83fr4b3rmmj,
  I24s4g6gkj5oec,
  Iapqe6jot9df6,
  If64i3fucaastf,
  Ietluscr05n0a8,
  Idcabvplu05lea,
  I2ncccle6pmhd9,
  I92bnd3pe0civj,
  Ic84i538n8bl8j,
  Ia8ogbeici6lip,
  Itmchvgqfl28g,
  I10hmgseei3j6r,
  I8p4numg1r4ojm,
  Idtucog650c7f8,
  I4kvfua9fqrpi2,
  I7t5blhj97u8r7,
  I21qpgggberqt3,
  Id7r4m9aulb7sn,
  Ielqbuofrsq2ri,
  I3hno1r9147mro,
  Iaihikf7d0fpt7,
  Iaehj4ajaudum7,
  Id83ilm95if0sl,
  I82r4tvnf2s05i,
  Ico8a80unk7v19,
  Ib9aiguc778ujf,
  Ib7m93b836tdpq,
  I5n4sebgkfr760,
  Iavvprr56ai2oq,
  Ifs1i5fk9cqvr6,
  I7t5t1pb9tm22k,
  I8ecgqolcgg12u,
  Ieg3fd8p4pkt10,
  I8kg5ll427kfqq,
  I467333262q1l9,
  I60v7bikk54tpu,
  Ifpj261e8s63m3,
  I9paqujeb1fpv6,
  Iakevv83i18n4r,
  If2ssl12kcglhg,
  Iabk8ljl5g8c86,
  Ic76kfh5ebqkpl,
  Icrujen33bbibf,
  I5gi8h3e5lkbeq,
  Ibgm4rnf22lal1,
  I8mmaab8je28oo,
  I6r0pr82pbiftt,
  I40pqum1mu8qg3,
  I1r4c2ghbtvjuc,
  I6t8mv3ij8f6jn,
  Idu1ujel33jksu,
  I1ii8c8cvda9o5,
  I40fog3d0qlub1,
  Ibahh2k28pd3rl,
  Iaif2nhfhk9qc0,
  Ifccifqltb5obi,
  Iadtsfv699cq8b,
  Ialpmgmhr3gk5r,
  I4cbvqmqadhrea,
  I3sdol54kg5jaq,
  I8fougodaj6di6,
  I81vt5eq60l4b6,
  Iabgdocrka40v9,
  Ia82mnkmeo2rhc,
  I17lrc78ftgqcp,
  I855j4i3kr8ko1,
  Icv68aq8841478,
  Ic262ibdoec56a,
  Iflcfm9b6nlmdd,
  Ijrsf4mnp3eka,
  I8tjvj9uq4b7hi,
  I4fooe9dun9o0t,
  Ier2cke86dqbr2,
  I1o37fpk9vgbri,
  I859063tfqget1,
  I44hc4lgsn4o1j,
  I8iksqi3eani0a,
  I16enopmju1p0q,
  Ifgqhle2413de7,
  I43kq8qudg7pq9,
  I76riseemre533,
  Ie5v6njpckr05b,
  I38bmcrmh852rk,
  I4hcillge8de5f,
  I8usdc6tg7829p,
  Idrghm97v133l7,
  I2bgne8ai793cl,
  I1d43pfvgh75ar,
  Iep1lmt6q3s6r3,
  I1fac16213rie2,
  Ifjt77oc391o43,
  Itvt1jsipv0lc,
  Ick3mveut33f44,
  Ibdqerrooruuq9,
  I8u2ba9jeiu6q0,
  I7ieadb293k6b4,
  I3peh714diura8,
  I62ffgu6q2478o,
  I10r7il4gvbcae,
  I2c00i2bngegk9,
  Iet7kfijhihjik,
  I2vrbos7ogo6ps,
  Iffeo46j957abe,
  I4ljshcevmm3p2,
  Iaofef34v2445a,
  Ie3gphha4ejh40,
  I4b66js88p45m8,
  I50d9r8lrdga93,
  I27avf13g71mla,
  Ift6f10887nk72,
  I7qc53b1tvqjg2,
  I4q0j6fg2t2god,
  Iak7fhrgb9jnnq,
  Iep7an7g10jgpc,
  Ierev02d74bpoa,
  Ic836gl3ins837,
  Ic3vmcebni2jj7,
  I2ur0oeqg495j8,
  I3opji3hcv2fmd,
  Iep27ialq4a7o7,
  Iasu5jvoqr43mv,
  I1s1qkhv9546hq,
  I5qolde99acmd1,
  I86naabrotue2j,
  I2r637rurl4t61,
  Iar6hlsh10hqst,
  I89nkv9adctj3n,
  I5seehdocrcoau,
  Ic2kg6kak0gd23,
  I2odpdgf7k5003,
  Ifmob7l1au7mdj,
  Iagqcb06kbevb1,
  Iec8defeh924b6,
  I2na29tt2afp0j,
  I229ijht536qdu,
  I62nte77gksm0f,
  I9cg2delv92pvq,
  Ilhp45uime5tp,
  I4f1hv034jf1dt,
  I7tn5uocmj423n,
  I6cn8fgvhihc8u,
  Iaa8ldhnekkm2a,
  Ir72g75rutn0i,
  I7i2rquf9o1sc4,
  I32ndibr4v59gl,
  Ichvhj93no2r9s,
  Ibo4guh1r2d417,
  I5bdik3e9dtr9m,
  Idml4kfacbec4q,
  I5po34152rrdd1,
  I8gu0uupiacpfc,
  I3qaapujidulnv,
  I5u2c8nrbcec0n,
  I193fovq1blcqu,
  I4qeb32vu4p1o2,
  Icatb69nkfsv2d,
  Iao3tfuiovep78,
  I1cq0joe6ba7us,
  I8p8774nu1gec7,
  I58kb78e8933i0,
  Idhf8n2m782jc6,
  I8qbcd8kjt9b35,
  I9fddbmtajbhgk,
  I16oglmrf6q8h2,
  I56vurdc4pd324,
  Iv3iro9hpdvcu,
  I725512ll00rul,
  Ibnohbnq46n24i,
  If1007933akv96,
  I11glevchscfbg,
  Ifrsdu7763lo3e,
  I1rcm9o2k31p0u,
  I90op6i3kabg2t,
  If7ps0a75qku2k,
  I4qcsbrcg45e5p,
  I2gupahud9i8tv,
  Idmv46n4bkamls,
  I88qo502j1hm6r,
  I44sqbdseede38,
  I203slt75ll6b5,
  I9buamva6m987d,
  I931cottvong90,
  I15i908ukdv01j,
  I3md9r9ud9jcmi,
  I4rlrhubptb25s,
  Ibb0j2hs2i32f5,
  Iae6luacdfosbm,
  Idvrgp2jjkjaee,
  I6q2a2o24kbh1n,
  Iflfus32kckdgg,
  I7e9lbuqrul79d,
  Idpc6o3gv6oduv,
  I789ltv1nd8rlg,
  I5nm6uebbrcvd2,
  I1966f4idd9els,
  I8hof8vbjel5j0,
  Ic20as3skakdjb,
  Ieg2h8ei7d5hi,
  I8c5lgkcpg07sj,
  Ieas3thfe5cojl,
  I2rjku3c860luj,
  I82vqlr4shhaso,
  I2age4ibb0qdmq,
  I4do2q74i35m,
  Iehf2srrsvlrt4,
  I1a3321bv4rsn2,
  Ibmagsilt697o6,
  I73g6utvpcmklb,
  I4uo49pmivhb33,
  Ifmc9boeeia623,
  Iea4g5ovhnolus,
  I8363i1h1dgh0n,
  Ibqjgs3foip9fb,
  I4o7otrppfgqfl,
  I4h1hamhsvt02v,
  Ibil4nv30gc4gi,
  I2k8785n6tr14a,
  I1mm5epgr01rv3,
  Ia4163nej70ub3,
  Iec641q1s1ifm2,
  I4rrqp6atse8pe,
  I17mdck5880djt,
  I140nraqvlukpk,
  Irs8utdvl0ftp,
  Ib2ojij8i8r7vn,
  Iumh462jqskl8,
  I88onmld8ptm2c,
  I91fqhmftmm9on,
  Ia3c82eadg79bj,
  Ienusoeb625ftq,
  Idd7hd99u0ho0n,
  Iafscmv8tjf0ou,
  I100l07kaehdlp,
  I6gnbnvip5vvdi,
  I2aatv5i0cb96a,
  Ib9msr5sr8t3dn,
  I3le5tr7ugg6l2,
  I3iun9sig164po,
  I2uqmls7kcdnii,
  Idg69klialbkb8,
  I13jboebjcbglr,
  I30pg328m00nr3,
  I381dkhrurdhrs,
  Ic8hi3qr11vngc,
  Ibjdlecumfu7q7,
  Ia9ems1kg7laoc,
  I92fq0fa45vi3,
  Id01dpp0dn2cj0,
  I6nu8k62ck9o8o,
  I6s1nbislhk619,
  Iea25i7vqm7ot3,
  I137t1cld92pod,
  I3vs6qhrit34fa,
  Ia3uu7lqcc1q1i,
  I7crucfnonitkn,
  I7tmrp94r9sq4n,
  Id3ajno3thjgec,
  Ic04t5m0ihvrp5,
  I7id9rd759h17f,
  I39t01nnod9109,
  I1qmtmbe5so8r3,
  Ih99m6ehpcar7,
  Idgorhsbgdq2ap,
  I9ubb2kqevnu6t,
  I2hq50pu2kdjpo,
  Ieud99mk6qrhbc,
  Ibplkiqg5rvr3e,
  Icnmrtlo128skq,
  Icojqvn3afk41n,
  Iaqet9jc3ihboe,
  Ic952bubvq4k7d,
  I2v50gu3s1aqk6,
  Iabpgqcjikia83,
  I1202o7g6hne7p,
  If7uv525tdvv7a,
  I2an1fs2eiebjp,
  TransactionValidityTransactionSource,
  Iajbob6uln5jct,
  Icerf8h8pdu8ss,
  Ic1d4u2opv3fst,
  I4g15ko4u63fja,
  I6spmpef2c7svf,
  Iei2mvq0mjvt81,
  If08sfhqn8ujfr,
  Ic4rgfgksgmm3e,
  I3dj14b7k3rkm5,
  I5ahnvkd6fugsq,
  I370s3chedlj9o,
  Ifogockjiq4b3,
  I2r0n4gcrs974b,
  Ie6kgk6f04rsvk,
  Ibkook56hopvp8,
  I1fl9qh2r1hf29,
  I4arjljr6dpflb,
  I45rl58hfs7m0h,
  I6fr2mqud652ga,
  Ihfphjolmsqq1,
  I1p1369d52j8jd,
  XcmVersionedXcm,
  Ic0c3req3mlc1l,
  XcmVersionedAssetId,
  I7ocn4njqde3v5,
  XcmVersionedLocation,
  I5rlt6h8ph553n,
  Ie9sr1iqcg3cgm,
  I1mqgk2tmnn9i2,
  I6lr8sctk0bi4e,
  I9sdjnqgsnrang,
} from './common-types';
type AnonymousEnum<T extends {}> = T & {
  __anonymous: true;
};
type MyTuple<T> = [T, ...T[]];
type SeparateUndefined<T> = undefined extends T
  ? undefined | Exclude<T, undefined>
  : T;
type Anonymize<T> = SeparateUndefined<
  T extends FixedSizeBinary<infer L>
    ? number extends L
      ? Binary
      : FixedSizeBinary<L>
    : T extends
          | string
          | number
          | bigint
          | boolean
          | void
          | undefined
          | null
          | symbol
          | Uint8Array
          | Enum<any>
      ? T
      : T extends AnonymousEnum<infer V>
        ? Enum<V>
        : T extends MyTuple<any>
          ? {
              [K in keyof T]: T[K];
            }
          : T extends []
            ? []
            : T extends FixedSizeArray<infer L, infer T>
              ? number extends L
                ? Array<T>
                : FixedSizeArray<L, T>
              : {
                  [K in keyof T & string]: T[K];
                }
>;
type IStorage = {
  System: {
    /**
     * The full account information for a particular account ID.
     */
    Account: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I5sesotjlssv2d>,
      false,
      never
    >;
    /**
     * Total extrinsics count for the current block.
     */
    ExtrinsicCount: StorageDescriptor<[], number, true, never>;
    /**
     * Whether all inherents have been applied.
     */
    InherentsApplied: StorageDescriptor<[], boolean, false, never>;
    /**
     * The current weight for the block.
     */
    BlockWeight: StorageDescriptor<[], Anonymize<Iffmde3ekjedi9>, false, never>;
    /**
     * Total length (in bytes) for all extrinsics put together, for the current block.
     */
    AllExtrinsicsLen: StorageDescriptor<[], number, true, never>;
    /**
     * Map of block numbers to block hashes.
     */
    BlockHash: StorageDescriptor<
      [Key: number],
      FixedSizeBinary<32>,
      false,
      never
    >;
    /**
     * Extrinsics data for the current block (maps an extrinsic's index to its data).
     */
    ExtrinsicData: StorageDescriptor<[Key: number], Binary, false, never>;
    /**
     * The current block number being processed. Set by `execute_block`.
     */
    Number: StorageDescriptor<[], number, false, never>;
    /**
     * Hash of the previous block.
     */
    ParentHash: StorageDescriptor<[], FixedSizeBinary<32>, false, never>;
    /**
     * Digest of the current block, also part of the block header.
     */
    Digest: StorageDescriptor<[], Anonymize<I4mddgoa69c0a2>, false, never>;
    /**
     * Events deposited for the current block.
     *
     * NOTE: The item is unbound and should therefore never be read on chain.
     * It could otherwise inflate the PoV size of a block.
     *
     * Events have a large in-memory size. Box the events to not go out-of-memory
     * just in case someone still reads them from within the runtime.
     */
    Events: StorageDescriptor<[], Anonymize<I86ve4guev2c9>, false, never>;
    /**
     * The number of events in the `Events<T>` list.
     */
    EventCount: StorageDescriptor<[], number, false, never>;
    /**
     * Mapping between a topic (represented by T::Hash) and a vector of indexes
     * of events in the `<Events<T>>` list.
     *
     * All topic vectors have deterministic storage locations depending on the topic. This
     * allows light-clients to leverage the changes trie storage tracking mechanism and
     * in case of changes fetch the list of events of interest.
     *
     * The value has the type `(BlockNumberFor<T>, EventIndex)` because if we used only just
     * the `EventIndex` then in case if the topic has the same contents on the next block
     * no notification will be triggered thus the event might be lost.
     */
    EventTopics: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      Anonymize<I95g6i7ilua7lq>,
      false,
      never
    >;
    /**
     * Stores the `spec_version` and `spec_name` of when the last runtime upgrade happened.
     */
    LastRuntimeUpgrade: StorageDescriptor<
      [],
      Anonymize<Ieniouoqkq4icf>,
      true,
      never
    >;
    /**
     * True if we have upgraded so that `type RefCount` is `u32`. False (default) if not.
     */
    UpgradedToU32RefCount: StorageDescriptor<[], boolean, false, never>;
    /**
     * True if we have upgraded so that AccountInfo contains three types of `RefCount`. False
     * (default) if not.
     */
    UpgradedToTripleRefCount: StorageDescriptor<[], boolean, false, never>;
    /**
     * The execution phase of the block.
     */
    ExecutionPhase: StorageDescriptor<[], Phase, true, never>;
    /**
     * `Some` if a code upgrade has been authorized.
     */
    AuthorizedUpgrade: StorageDescriptor<
      [],
      Anonymize<Ibgl04rn6nbfm6>,
      true,
      never
    >;
  };
  Timestamp: {
    /**
     * The current time for the current block.
     */
    Now: StorageDescriptor<[], bigint, false, never>;
    /**
     * Whether the timestamp has been updated in this block.
     *
     * This value is updated to `true` upon successful submission of a timestamp by a node.
     * It is then checked at the end of each block execution in the `on_finalize` hook.
     */
    DidUpdate: StorageDescriptor<[], boolean, false, never>;
  };
  Balances: {
    /**
     * The total units issued in the system.
     */
    TotalIssuance: StorageDescriptor<[], bigint, false, never>;
    /**
     * The total units of outstanding deactivated balance in the system.
     */
    InactiveIssuance: StorageDescriptor<[], bigint, false, never>;
    /**
     * The Balances pallet example of storing the balance of an account.
     *
     * # Example
     *
     * ```nocompile
     *  impl pallet_balances::Config for Runtime {
     *    type AccountStore = StorageMapShim<Self::Account<Runtime>, frame_system::Provider<Runtime>, AccountId, Self::AccountData<Balance>>
     *  }
     * ```
     *
     * You can also store the balance of an account in the `System` pallet.
     *
     * # Example
     *
     * ```nocompile
     *  impl pallet_balances::Config for Runtime {
     *   type AccountStore = System
     *  }
     * ```
     *
     * But this comes with tradeoffs, storing account balances in the system pallet stores
     * `frame_system` data alongside the account data contrary to storing account balances in the
     * `Balances` pallet, which uses a `StorageMap` to store balances data only.
     * NOTE: This is only used in the case that this pallet is used to store balances.
     */
    Account: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I1q8tnt1cluu5j>,
      false,
      never
    >;
    /**
     * Any liquidity locks on some account balances.
     * NOTE: Should only be accessed when setting, changing and freeing a lock.
     *
     * Use of locks is deprecated in favour of freezes. See `https://github.com/paritytech/substrate/pull/12951/`
     */
    Locks: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I8ds64oj6581v0>,
      false,
      never
    >;
    /**
     * Named reserves on some account balances.
     *
     * Use of reserves is deprecated in favour of holds. See `https://github.com/paritytech/substrate/pull/12951/`
     */
    Reserves: StorageDescriptor<
      [Key: SS58String],
      Anonymize<Ia7pdug7cdsg8g>,
      false,
      never
    >;
    /**
     * Holds on account balances.
     */
    Holds: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I3oiqtmlj7klbr>,
      false,
      never
    >;
    /**
     * Freeze locks on account balances.
     */
    Freezes: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I9bin2jc70qt6q>,
      false,
      never
    >;
  };
  TransactionPayment: {
    /**
        
         */
    NextFeeMultiplier: StorageDescriptor<[], bigint, false, never>;
    /**
        
         */
    StorageVersion: StorageDescriptor<
      [],
      TransactionPaymentReleases,
      false,
      never
    >;
  };
  MultiTransactionPayment: {
    /**
     * Account currency map
     */
    AccountCurrencyMap: StorageDescriptor<
      [Key: SS58String],
      number,
      true,
      never
    >;
    /**
     * Curated list of currencies which fees can be paid mapped to corresponding fallback price
     */
    AcceptedCurrencies: StorageDescriptor<[Key: number], bigint, true, never>;
    /**
     * Asset prices from the spot price provider or the fallback price if the price is not available. Updated at the beginning of every block.
     */
    AcceptedCurrencyPrice: StorageDescriptor<
      [Key: number],
      bigint,
      true,
      never
    >;
    /**
        
         */
    TransactionCurrencyOverride: StorageDescriptor<
      [Key: SS58String],
      number,
      true,
      never
    >;
  };
  Treasury: {
    /**
     * Number of proposals that have been made.
     */
    ProposalCount: StorageDescriptor<[], number, false, never>;
    /**
     * Proposals that have been made.
     */
    Proposals: StorageDescriptor<
      [Key: number],
      Anonymize<Iegmj7n48sc3am>,
      true,
      never
    >;
    /**
     * The amount which has been reported as inactive to Currency.
     */
    Deactivated: StorageDescriptor<[], bigint, false, never>;
    /**
     * Proposal indices that have been approved but not yet awarded.
     */
    Approvals: StorageDescriptor<[], Anonymize<Icgljjb6j82uhn>, false, never>;
    /**
     * The count of spends that have been made.
     */
    SpendCount: StorageDescriptor<[], number, false, never>;
    /**
     * Spends that have been approved and being processed.
     */
    Spends: StorageDescriptor<
      [Key: number],
      Anonymize<Ie9j1itogtv7p5>,
      true,
      never
    >;
  };
  Preimage: {
    /**
     * The request status of a given hash.
     */
    StatusFor: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      PreimageOldRequestStatus,
      true,
      never
    >;
    /**
     * The request status of a given hash.
     */
    RequestStatusFor: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      PreimageRequestStatus,
      true,
      never
    >;
    /**
        
         */
    PreimageFor: StorageDescriptor<
      [Key: Anonymize<I4pact7n2e9a0i>],
      Binary,
      true,
      never
    >;
  };
  Identity: {
    /**
     * Information that is pertinent to identify the entity behind an account. First item is the
     * registration, second is the account's primary username.
     *
     * TWOX-NOTE: OK ― `AccountId` is a secure hash.
     */
    IdentityOf: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I1evsr8hplu1lg>,
      true,
      never
    >;
    /**
     * The super-identity of an alternative "sub" identity together with its name, within that
     * context. If the account is not some other account's sub-identity, then just `None`.
     */
    SuperOf: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I910puuahutflf>,
      true,
      never
    >;
    /**
     * Alternative "sub" identities of this account.
     *
     * The first item is the deposit, the second is a vector of the accounts.
     *
     * TWOX-NOTE: OK ― `AccountId` is a secure hash.
     */
    SubsOf: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I4nfjdef0ibh44>,
      false,
      never
    >;
    /**
     * The set of registrars. Not expected to get very big as can only be added through a
     * special origin (likely a council motion).
     *
     * The index into this can be cast to `RegistrarIndex` to get a valid value.
     */
    Registrars: StorageDescriptor<[], Anonymize<I74af64m08r6as>, false, never>;
    /**
     * A map of the accounts who are authorized to grant usernames.
     */
    UsernameAuthorities: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I9bhbof2vim227>,
      true,
      never
    >;
    /**
     * Reverse lookup from `username` to the `AccountId` that has registered it. The value should
     * be a key in the `IdentityOf` map, but it may not if the user has cleared their identity.
     *
     * Multiple usernames may map to the same `AccountId`, but `IdentityOf` will only map to one
     * primary username.
     */
    AccountOfUsername: StorageDescriptor<
      [Key: Binary],
      SS58String,
      true,
      never
    >;
    /**
     * Usernames that an authority has granted, but that the account controller has not confirmed
     * that they want it. Used primarily in cases where the `AccountId` cannot provide a signature
     * because they are a pure proxy, multisig, etc. In order to confirm it, they should call
     * [`Call::accept_username`].
     *
     * First tuple item is the account and second is the acceptance deadline.
     */
    PendingUsernames: StorageDescriptor<
      [Key: Binary],
      Anonymize<I6ouflveob4eli>,
      true,
      never
    >;
  };
  Democracy: {
    /**
     * The number of (public) proposals that have been made so far.
     */
    PublicPropCount: StorageDescriptor<[], number, false, never>;
    /**
     * The public proposals. Unsorted. The second item is the proposal.
     */
    PublicProps: StorageDescriptor<[], Anonymize<I6mhebgj62g585>, false, never>;
    /**
     * Those who have locked a deposit.
     *
     * TWOX-NOTE: Safe, as increasing integer keys are safe.
     */
    DepositOf: StorageDescriptor<
      [Key: number],
      Anonymize<I3vhcedhm4hpvm>,
      true,
      never
    >;
    /**
     * The next free referendum index, aka the number of referenda started so far.
     */
    ReferendumCount: StorageDescriptor<[], number, false, never>;
    /**
     * The lowest referendum index representing an unbaked referendum. Equal to
     * `ReferendumCount` if there isn't a unbaked referendum.
     */
    LowestUnbaked: StorageDescriptor<[], number, false, never>;
    /**
     * Information concerning any given referendum.
     *
     * TWOX-NOTE: SAFE as indexes are not under an attacker’s control.
     */
    ReferendumInfoOf: StorageDescriptor<
      [Key: number],
      Anonymize<I526daka7j7b17>,
      true,
      never
    >;
    /**
     * All votes for a particular voter. We store the balance for the number of votes that we
     * have recorded. The second item is the total amount of delegations, that will be added.
     *
     * TWOX-NOTE: SAFE as `AccountId`s are crypto hashes anyway.
     */
    VotingOf: StorageDescriptor<
      [Key: SS58String],
      Anonymize<Ifanv2kvm586s4>,
      false,
      never
    >;
    /**
     * True if the last referendum tabled was submitted externally. False if it was a public
     * proposal.
     */
    LastTabledWasExternal: StorageDescriptor<[], boolean, false, never>;
    /**
     * The referendum to be tabled whenever it would be valid to table an external proposal.
     * This happens when a referendum needs to be tabled and one of two conditions are met:
     * - `LastTabledWasExternal` is `false`; or
     * - `PublicProps` is empty.
     */
    NextExternal: StorageDescriptor<[], Anonymize<I5rsgtofmn5lli>, true, never>;
    /**
     * A record of who vetoed what. Maps proposal hash to a possible existent block number
     * (until when it may not be resubmitted) and who vetoed it.
     */
    Blacklist: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      Anonymize<Idned7t7knml6b>,
      true,
      never
    >;
    /**
     * Record of all proposals that have been subject to emergency cancellation.
     */
    Cancellations: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      boolean,
      false,
      never
    >;
    /**
     * General information concerning any proposal or referendum.
     * The `Hash` refers to the preimage of the `Preimages` provider which can be a JSON
     * dump or IPFS hash of a JSON file.
     *
     * Consider a garbage collection for a metadata of finished referendums to `unrequest` (remove)
     * large preimages.
     */
    MetadataOf: StorageDescriptor<
      [Key: Anonymize<I2itl2k1j2q8nf>],
      FixedSizeBinary<32>,
      true,
      never
    >;
  };
  Elections: {
    /**
     * The current elected members.
     *
     * Invariant: Always sorted based on account id.
     */
    Members: StorageDescriptor<[], Anonymize<I8nj9dlo7lnbb3>, false, never>;
    /**
     * The current reserved runners-up.
     *
     * Invariant: Always sorted based on rank (worse to best). Upon removal of a member, the
     * last (i.e. _best_) runner-up will be replaced.
     */
    RunnersUp: StorageDescriptor<[], Anonymize<I8nj9dlo7lnbb3>, false, never>;
    /**
     * The present candidate list. A current member or runner-up can never enter this vector
     * and is always implicitly assumed to be a candidate.
     *
     * Second element is the deposit.
     *
     * Invariant: Always sorted based on account id.
     */
    Candidates: StorageDescriptor<[], Anonymize<Iba9inugg1atvo>, false, never>;
    /**
     * The total number of vote rounds that have happened, excluding the upcoming one.
     */
    ElectionRounds: StorageDescriptor<[], number, false, never>;
    /**
     * Votes and locked stake of a particular voter.
     *
     * TWOX-NOTE: SAFE as `AccountId` is a crypto hash.
     */
    Voting: StorageDescriptor<
      [Key: SS58String],
      Anonymize<Ib23vkkc52tqbu>,
      false,
      never
    >;
  };
  Council: {
    /**
     * The hashes of the active proposals.
     */
    Proposals: StorageDescriptor<[], Anonymize<Ic5m5lp1oioo8r>, false, never>;
    /**
     * Actual proposal for a given hash, if it's current.
     */
    ProposalOf: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      Anonymize<I3334u30i909c2>,
      true,
      never
    >;
    /**
     * Votes on a given proposal, if it is ongoing.
     */
    Voting: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      Anonymize<I99bb69usss9gs>,
      true,
      never
    >;
    /**
     * Proposals so far.
     */
    ProposalCount: StorageDescriptor<[], number, false, never>;
    /**
     * The current members of the collective. This is stored sorted (just by value).
     */
    Members: StorageDescriptor<[], Anonymize<Ia2lhg7l2hilo3>, false, never>;
    /**
     * The prime member that helps determine the default vote behavior in case of abstentions.
     */
    Prime: StorageDescriptor<[], SS58String, true, never>;
  };
  TechnicalCommittee: {
    /**
     * The hashes of the active proposals.
     */
    Proposals: StorageDescriptor<[], Anonymize<Ic5m5lp1oioo8r>, false, never>;
    /**
     * Actual proposal for a given hash, if it's current.
     */
    ProposalOf: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      Anonymize<I3334u30i909c2>,
      true,
      never
    >;
    /**
     * Votes on a given proposal, if it is ongoing.
     */
    Voting: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      Anonymize<I99bb69usss9gs>,
      true,
      never
    >;
    /**
     * Proposals so far.
     */
    ProposalCount: StorageDescriptor<[], number, false, never>;
    /**
     * The current members of the collective. This is stored sorted (just by value).
     */
    Members: StorageDescriptor<[], Anonymize<Ia2lhg7l2hilo3>, false, never>;
    /**
     * The prime member that helps determine the default vote behavior in case of abstentions.
     */
    Prime: StorageDescriptor<[], SS58String, true, never>;
  };
  Tips: {
    /**
     * TipsMap that are not yet completed. Keyed by the hash of `(reason, who)` from the value.
     * This has the insecure enumerable hash function since the key itself is already
     * guaranteed to be a secure hash.
     */
    Tips: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      Anonymize<I8fkfedbgu1sn3>,
      true,
      never
    >;
    /**
     * Simple preimage lookup from the reason's hash to the original data. Again, has an
     * insecure enumerable hash since the key is guaranteed to be the result of a secure hash.
     */
    Reasons: StorageDescriptor<[Key: FixedSizeBinary<32>], Binary, true, never>;
  };
  Proxy: {
    /**
     * The set of account proxies. Maps the account which has delegated to the accounts
     * which are being delegated to, together with the amount held on deposit.
     */
    Proxies: StorageDescriptor<
      [Key: SS58String],
      Anonymize<Iegjdtqhbb6qh9>,
      false,
      never
    >;
    /**
     * The announcements made by the proxy (key).
     */
    Announcements: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I9p9lq3rej5bhc>,
      false,
      never
    >;
  };
  Multisig: {
    /**
     * The set of open multisig operations.
     */
    Multisigs: StorageDescriptor<
      Anonymize<I8uo3fpd3bcc6f>,
      Anonymize<Iag146hmjgqfgj>,
      true,
      never
    >;
  };
  Uniques: {
    /**
     * Details of a collection.
     */
    Class: StorageDescriptor<
      [Key: bigint],
      Anonymize<Ianufjuplcj6u4>,
      true,
      never
    >;
    /**
     * The collection, if any, of which an account is willing to take ownership.
     */
    OwnershipAcceptance: StorageDescriptor<
      [Key: SS58String],
      bigint,
      true,
      never
    >;
    /**
     * The items held by any given account; set out this way so that items owned by a single
     * account can be enumerated.
     */
    Account: StorageDescriptor<
      Anonymize<Ic3orq32is6lrl>,
      undefined,
      true,
      never
    >;
    /**
     * The collections owned by any given account; set out this way so that collections owned by
     * a single account can be enumerated.
     */
    ClassAccount: StorageDescriptor<
      Anonymize<I95l2k9b1re95f>,
      undefined,
      true,
      never
    >;
    /**
     * The items in existence and their ownership details.
     */
    Asset: StorageDescriptor<
      Anonymize<I200n1ov5tbcvr>,
      Anonymize<I2mv9dvsaj3kcr>,
      true,
      never
    >;
    /**
     * Metadata of a collection.
     */
    ClassMetadataOf: StorageDescriptor<
      [Key: bigint],
      Anonymize<I7781vnk0rm9eq>,
      true,
      never
    >;
    /**
     * Metadata of an item.
     */
    InstanceMetadataOf: StorageDescriptor<
      Anonymize<I200n1ov5tbcvr>,
      Anonymize<I7781vnk0rm9eq>,
      true,
      never
    >;
    /**
     * Attributes of a collection.
     */
    Attribute: StorageDescriptor<
      Anonymize<I974uplh4fafs4>,
      Anonymize<Ie2iqtdb0stqo1>,
      true,
      never
    >;
    /**
     * Price of an asset instance.
     */
    ItemPriceOf: StorageDescriptor<
      Anonymize<I200n1ov5tbcvr>,
      Anonymize<Ic9nev69d8grv1>,
      true,
      never
    >;
    /**
     * Keeps track of the number of items a collection might have.
     */
    CollectionMaxSupply: StorageDescriptor<[Key: bigint], number, true, never>;
  };
  StateTrieMigration: {
    /**
     * Migration progress.
     *
     * This stores the snapshot of the last migrated keys. It can be set into motion and move
     * forward by any of the means provided by this pallet.
     */
    MigrationProcess: StorageDescriptor<
      [],
      Anonymize<If354jrdedj0pj>,
      false,
      never
    >;
    /**
     * The limits that are imposed on automatic migrations.
     *
     * If set to None, then no automatic migration happens.
     */
    AutoLimits: StorageDescriptor<[], Anonymize<Ib17t3992hb64n>, false, never>;
    /**
     * The maximum limits that the signed migration could use.
     *
     * If not set, no signed submission is allowed.
     */
    SignedMigrationMaxLimits: StorageDescriptor<
      [],
      Anonymize<I215mkl885p4da>,
      true,
      never
    >;
  };
  ConvictionVoting: {
    /**
     * All voting for a particular voter in a particular voting class. We store the balance for the
     * number of votes that we have recorded.
     */
    VotingFor: StorageDescriptor<
      Anonymize<I6ouflveob4eli>,
      ConvictionVotingVoteVoting,
      false,
      never
    >;
    /**
     * The voting classes which have a non-zero lock requirement and the lock amounts which they
     * require. The actual amount locked on behalf of this pallet should always be the maximum of
     * this list.
     */
    ClassLocksFor: StorageDescriptor<
      [Key: SS58String],
      Anonymize<If9jidduiuq7vv>,
      false,
      never
    >;
  };
  Referenda: {
    /**
     * The next free referendum index, aka the number of referenda started so far.
     */
    ReferendumCount: StorageDescriptor<[], number, false, never>;
    /**
     * Information concerning any given referendum.
     */
    ReferendumInfoFor: StorageDescriptor<
      [Key: number],
      Anonymize<I7l9ov6gsk96cm>,
      true,
      never
    >;
    /**
     * The sorted list of referenda ready to be decided but not yet being decided, ordered by
     * conviction-weighted approvals.
     *
     * This should be empty if `DecidingCount` is less than `TrackInfo::max_deciding`.
     */
    TrackQueue: StorageDescriptor<
      [Key: number],
      Anonymize<If9jidduiuq7vv>,
      false,
      never
    >;
    /**
     * The number of referenda being decided currently.
     */
    DecidingCount: StorageDescriptor<[Key: number], number, false, never>;
    /**
     * The metadata is a general information concerning the referendum.
     * The `Hash` refers to the preimage of the `Preimages` provider which can be a JSON
     * dump or IPFS hash of a JSON file.
     *
     * Consider a garbage collection for a metadata of finished referendums to `unrequest` (remove)
     * large preimages.
     */
    MetadataOf: StorageDescriptor<
      [Key: number],
      FixedSizeBinary<32>,
      true,
      never
    >;
  };
  Whitelist: {
    /**
        
         */
    WhitelistedCall: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      undefined,
      true,
      never
    >;
  };
  Dispatcher: {
    /**
        
         */
    AaveManagerAccount: StorageDescriptor<[], SS58String, false, never>;
  };
  AssetRegistry: {
    /**
     * Details of an asset.
     */
    Assets: StorageDescriptor<
      [Key: number],
      Anonymize<Ifj0li5nn5unet>,
      true,
      never
    >;
    /**
     * Next available asset id. This is sequential id assigned for each new registered asset.
     */
    NextAssetId: StorageDescriptor<[], number, false, never>;
    /**
     * Mapping between asset name and asset id.
     */
    AssetIds: StorageDescriptor<[Key: Binary], number, true, never>;
    /**
     * Native location of an asset.
     */
    AssetLocations: StorageDescriptor<
      [Key: number],
      Anonymize<I4c0s5cioidn76>,
      true,
      never
    >;
    /**
     * Non-native assets which transfer is banned.
     */
    BannedAssets: StorageDescriptor<[Key: number], undefined, true, never>;
    /**
     * Local asset for native location.
     */
    LocationAssets: StorageDescriptor<
      [Key: Anonymize<I4c0s5cioidn76>],
      number,
      true,
      never
    >;
    /**
     * Number of accounts that paid existential deposits for insufficient assets.
     * This storage is used by `SufficiencyCheck`.
     */
    ExistentialDepositCounter: StorageDescriptor<[], bigint, false, never>;
  };
  Claims: {
    /**
     * Asset id storage for each shared token
     */
    Claims: StorageDescriptor<[Key: FixedSizeBinary<20>], bigint, false, never>;
  };
  GenesisHistory: {
    /**
        
         */
    PreviousChain: StorageDescriptor<
      [],
      Anonymize<Isibf8mrredhc>,
      false,
      never
    >;
  };
  CollatorRewards: {
    /**
     * Stores the collators per session (index).
     */
    Collators: StorageDescriptor<
      [Key: number],
      Anonymize<Ia2lhg7l2hilo3>,
      false,
      never
    >;
  };
  Omnipool: {
    /**
     * State of an asset in the omnipool
     */
    Assets: StorageDescriptor<
      [Key: number],
      Anonymize<I8ikpj86u2na1q>,
      true,
      never
    >;
    /**
     * Imbalance of hub asset
     */
    HubAssetImbalance: StorageDescriptor<
      [],
      Anonymize<I23jd67h2erm49>,
      false,
      never
    >;
    /**
     * Tradable state of hub asset.
     */
    HubAssetTradability: StorageDescriptor<[], number, false, never>;
    /**
     * LP positions. Maps NFT instance id to corresponding position
     */
    Positions: StorageDescriptor<
      [Key: bigint],
      Anonymize<Icbsch55a85u5u>,
      true,
      never
    >;
    /**
     * Position ids sequencer
     */
    NextPositionId: StorageDescriptor<[], bigint, false, never>;
  };
  TransactionPause: {
    /**
     * The paused transaction map
     *
     * map (PalletNameBytes, FunctionNameBytes) => Option<()>
     */
    PausedTransactions: StorageDescriptor<
      [Key: Anonymize<Idkbvh6dahk1v7>],
      undefined,
      true,
      never
    >;
  };
  Duster: {
    /**
     * Accounts excluded from dusting.
     */
    AccountBlacklist: StorageDescriptor<
      [Key: SS58String],
      undefined,
      true,
      never
    >;
    /**
     * Account to take reward from.
     */
    RewardAccount: StorageDescriptor<[], SS58String, true, never>;
    /**
     * Account to send dust to.
     */
    DustAccount: StorageDescriptor<[], SS58String, true, never>;
  };
  OmnipoolWarehouseLM: {
    /**
     * Id sequencer for `GlobalFarm` and `YieldFarm`.
     */
    FarmSequencer: StorageDescriptor<[], number, false, never>;
    /**
        
         */
    DepositSequencer: StorageDescriptor<[], bigint, false, never>;
    /**
        
         */
    GlobalFarm: StorageDescriptor<
      [Key: number],
      Anonymize<I5ugnv0dol8v8t>,
      true,
      never
    >;
    /**
     * Yield farm details.
     */
    YieldFarm: StorageDescriptor<
      Anonymize<Ielgh4t8o7rcvt>,
      Anonymize<I1ksaufim9dq1c>,
      true,
      never
    >;
    /**
     * Deposit details.
     */
    Deposit: StorageDescriptor<
      [Key: bigint],
      Anonymize<I3rvqhkck00laj>,
      true,
      never
    >;
    /**
     * Active(farms able to receive LP shares deposits) yield farms.
     */
    ActiveYieldFarm: StorageDescriptor<
      Anonymize<I9jd27rnpm8ttv>,
      number,
      true,
      never
    >;
  };
  OmnipoolLiquidityMining: {
    /**
     * Map of omnipool position's ids to LM's deposit ids.
     */
    OmniPositionId: StorageDescriptor<[Key: bigint], bigint, true, never>;
  };
  OTC: {
    /**
     * ID sequencer for Orders
     */
    NextOrderId: StorageDescriptor<[], number, false, never>;
    /**
        
         */
    Orders: StorageDescriptor<
      [Key: number],
      Anonymize<I7bcpl5g2rcql5>,
      true,
      never
    >;
  };
  CircuitBreaker: {
    /**
     * Trade volume limits of assets set by set_trade_volume_limit.
     * If not set, returns the default limit.
     */
    TradeVolumeLimitPerAsset: StorageDescriptor<
      [Key: number],
      Anonymize<I9jd27rnpm8ttv>,
      false,
      never
    >;
    /**
     * Trade volumes per asset
     */
    AllowedTradeVolumeLimitPerAsset: StorageDescriptor<
      [Key: number],
      Anonymize<I4vdvk2616mp4t>,
      true,
      never
    >;
    /**
     * Liquidity limits of assets for adding liquidity.
     * If not set, returns the default limit.
     */
    LiquidityAddLimitPerAsset: StorageDescriptor<
      [Key: number],
      Anonymize<Iep7au1720bm0e>,
      false,
      never
    >;
    /**
     * Add liquidity volumes per asset
     */
    AllowedAddLiquidityAmountPerAsset: StorageDescriptor<
      [Key: number],
      Anonymize<I48olja7kd2ijk>,
      true,
      never
    >;
    /**
     * Liquidity limits of assets for removing liquidity.
     * If not set, returns the default limit.
     */
    LiquidityRemoveLimitPerAsset: StorageDescriptor<
      [Key: number],
      Anonymize<Iep7au1720bm0e>,
      false,
      never
    >;
    /**
     * Remove liquidity volumes per asset
     */
    AllowedRemoveLiquidityAmountPerAsset: StorageDescriptor<
      [Key: number],
      Anonymize<I48olja7kd2ijk>,
      true,
      never
    >;
  };
  Router: {
    /**
     *Flag to indicate when to skip ED handling
     */
    SkipEd: StorageDescriptor<[], Anonymize<I4q0p5rehstne>, true, never>;
    /**
     * Storing routes for asset pairs
     */
    Routes: StorageDescriptor<
      [Key: Anonymize<I4kv0johj9i346>],
      Anonymize<Iesal24fi7slt9>,
      true,
      never
    >;
  };
  DynamicFees: {
    /**
     * Stores last calculated fee of an asset and block number in which it was changed..
     * Stored as (Asset fee, Protocol fee, Block number)
     */
    AssetFee: StorageDescriptor<
      [Key: number],
      Anonymize<Ibn3i0ad6beo5l>,
      true,
      never
    >;
  };
  Staking: {
    /**
     * Global staking state.
     */
    Staking: StorageDescriptor<[], Anonymize<I10uqvdcdcld3o>, false, never>;
    /**
     * User's position state.
     */
    Positions: StorageDescriptor<
      [Key: bigint],
      Anonymize<I3fgr93o42d9hi>,
      true,
      never
    >;
    /**
     * Position ids sequencer.
     */
    NextPositionId: StorageDescriptor<[], bigint, false, never>;
    /**
     * List of position votes.
     */
    Votes: StorageDescriptor<
      [Key: bigint],
      Anonymize<Ihjc2vmjfhsmq>,
      false,
      never
    >;
    /**
     * List of processed vote. Used to determine if the vote should be locked in case of voting not in favor.
     */
    VotesRewarded: StorageDescriptor<
      Anonymize<I6ouflveob4eli>,
      Anonymize<I663kh18bno0fo>,
      true,
      never
    >;
    /**
     * Legacy storage! - Used to handle democracy votes until democracy pallet is fully removed.
     */
    PositionVotes: StorageDescriptor<
      [Key: bigint],
      Anonymize<Ihjc2vmjfhsmq>,
      false,
      never
    >;
    /**
     * Legacy storage! - Used to handle democracy processed votes until democracy pallet is fully removed.
     */
    ProcessedVotes: StorageDescriptor<
      Anonymize<I6ouflveob4eli>,
      Anonymize<I663kh18bno0fo>,
      true,
      never
    >;
  };
  Stableswap: {
    /**
     * Existing pools
     */
    Pools: StorageDescriptor<
      [Key: number],
      Anonymize<I1p5pqg6bllgtl>,
      true,
      never
    >;
    /**
     * Tradability state of pool assets.
     */
    AssetTradability: StorageDescriptor<
      Anonymize<I9jd27rnpm8ttv>,
      number,
      false,
      never
    >;
  };
  Bonds: {
    /**
     * Registered bond ids.
     * Maps (underlying asset ID, maturity) -> bond ID
     */
    BondIds: StorageDescriptor<
      [Key: Anonymize<I4ojmnsk1dchql>],
      number,
      true,
      never
    >;
    /**
     * Registered bonds.
     * Maps bond ID -> (underlying asset ID, maturity)
     */
    Bonds: StorageDescriptor<
      [Key: number],
      Anonymize<I4ojmnsk1dchql>,
      true,
      never
    >;
  };
  LBP: {
    /**
     * Details of a pool.
     */
    PoolData: StorageDescriptor<
      [Key: SS58String],
      Anonymize<Iesq88051ch8ht>,
      true,
      never
    >;
    /**
     * Storage used for tracking existing fee collectors
     * Not more than one fee collector per asset possible
     */
    FeeCollectorWithAsset: StorageDescriptor<
      Anonymize<I6ouflveob4eli>,
      boolean,
      false,
      never
    >;
  };
  XYK: {
    /**
     * Asset id storage for shared pool tokens
     */
    ShareToken: StorageDescriptor<[Key: SS58String], number, false, never>;
    /**
     * Total liquidity in a pool.
     */
    TotalLiquidity: StorageDescriptor<[Key: SS58String], bigint, false, never>;
    /**
     * Asset pair in a pool.
     */
    PoolAssets: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I9jd27rnpm8ttv>,
      true,
      never
    >;
  };
  Referrals: {
    /**
     * Referral codes
     * Maps a referral code to an account.
     */
    ReferralCodes: StorageDescriptor<[Key: Binary], SS58String, true, never>;
    /**
     * Referral accounts
     * Maps an account to a referral code.
     */
    ReferralAccounts: StorageDescriptor<[Key: SS58String], Binary, true, never>;
    /**
     * Linked accounts.
     * Maps an account to a referral account.
     */
    LinkedAccounts: StorageDescriptor<
      [Key: SS58String],
      SS58String,
      true,
      never
    >;
    /**
     * Shares of a referral account
     */
    ReferrerShares: StorageDescriptor<[Key: SS58String], bigint, false, never>;
    /**
     * Shares of a trader account
     */
    TraderShares: StorageDescriptor<[Key: SS58String], bigint, false, never>;
    /**
     * Total share issuance.
     */
    TotalShares: StorageDescriptor<[], bigint, false, never>;
    /**
     * Referer level and total accumulated rewards over time.
     * Maps referrer account to (Level, Balance). Level indicates current rewards and Balance is used to unlock next level.
     * Dev note: we use OptionQuery here because this helps to easily determine that an account if referrer account.
     */
    Referrer: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I9qpa0evftgoo5>,
      true,
      never
    >;
    /**
     * Asset fee distribution rewards information.
     * Maps (asset_id, level) to asset reward percentages.
     */
    AssetRewards: StorageDescriptor<
      Anonymize<I1stghsu756nk9>,
      Anonymize<I4qc61lpfqml75>,
      true,
      never
    >;
    /**
     * Information about assets that are currently in the rewards pot.
     * Used to easily determine list of assets that need to be converted.
     */
    PendingConversions: StorageDescriptor<
      [Key: number],
      undefined,
      true,
      never
    >;
    /**
     *Counter for the related counted storage map
     */
    CounterForPendingConversions: StorageDescriptor<[], number, false, never>;
  };
  Liquidation: {
    /**
     * Borrowing market contract address
     */
    BorrowingContract: StorageDescriptor<[], FixedSizeBinary<20>, false, never>;
  };
  Tokens: {
    /**
     * The total issuance of a token type.
     */
    TotalIssuance: StorageDescriptor<[Key: number], bigint, false, never>;
    /**
     * Any liquidity locks of a token type under an account.
     * NOTE: Should only be accessed when setting, changing and freeing a lock.
     */
    Locks: StorageDescriptor<
      Anonymize<I6ouflveob4eli>,
      Anonymize<Ia7pdug7cdsg8g>,
      false,
      never
    >;
    /**
     * The balance of a token type under an account.
     *
     * NOTE: If the total is ever zero, decrease account ref account.
     *
     * NOTE: This is only used in the case that this module is used to store
     * balances.
     */
    Accounts: StorageDescriptor<
      Anonymize<I6ouflveob4eli>,
      Anonymize<Ic02kut0350gb0>,
      false,
      never
    >;
    /**
     * Named reserves on some account balances.
     */
    Reserves: StorageDescriptor<
      Anonymize<I6ouflveob4eli>,
      Anonymize<Ia7pdug7cdsg8g>,
      false,
      never
    >;
  };
  Vesting: {
    /**
     * Vesting schedules of an account.
     *
     * VestingSchedules: map AccountId => Vec<VestingSchedule>
     */
    VestingSchedules: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I199nnq793ql30>,
      false,
      never
    >;
  };
  EVM: {
    /**
        
         */
    AccountCodes: StorageDescriptor<
      [Key: FixedSizeBinary<20>],
      Binary,
      false,
      never
    >;
    /**
        
         */
    AccountCodesMetadata: StorageDescriptor<
      [Key: FixedSizeBinary<20>],
      Anonymize<I7jidl7qnnq87c>,
      true,
      never
    >;
    /**
        
         */
    AccountStorages: StorageDescriptor<
      Anonymize<I82cps8ng2jtug>,
      FixedSizeBinary<32>,
      false,
      never
    >;
    /**
        
         */
    Suicided: StorageDescriptor<
      [Key: FixedSizeBinary<20>],
      undefined,
      true,
      never
    >;
  };
  EVMChainId: {
    /**
     * The EVM chain ID.
     */
    ChainId: StorageDescriptor<[], bigint, false, never>;
  };
  Ethereum: {
    /**
     * Current building block's transactions and receipts.
     */
    Pending: StorageDescriptor<[], Anonymize<Ic17drnrq0rtgi>, false, never>;
    /**
     * The current Ethereum block.
     */
    CurrentBlock: StorageDescriptor<[], Anonymize<Idi27giun0mb9q>, true, never>;
    /**
     * The current Ethereum receipts.
     */
    CurrentReceipts: StorageDescriptor<
      [],
      Anonymize<Idud3fdh64aqp9>,
      true,
      never
    >;
    /**
     * The current transaction statuses.
     */
    CurrentTransactionStatuses: StorageDescriptor<
      [],
      Anonymize<Ie7atdsih6q14b>,
      true,
      never
    >;
    /**
        
         */
    BlockHash: StorageDescriptor<
      [Key: Anonymize<I4totqt881mlti>],
      FixedSizeBinary<32>,
      false,
      never
    >;
  };
  EVMAccounts: {
    /**
     * Maps an EVM address to the last 12 bytes of a substrate account.
     */
    AccountExtension: StorageDescriptor<
      [Key: FixedSizeBinary<20>],
      FixedSizeBinary<12>,
      true,
      never
    >;
    /**
     * Whitelisted addresses that are allowed to deploy smart contracts.
     */
    ContractDeployer: StorageDescriptor<
      [Key: FixedSizeBinary<20>],
      undefined,
      true,
      never
    >;
    /**
     * Whitelisted contracts that are allowed to manage balances and tokens.
     */
    ApprovedContract: StorageDescriptor<
      [Key: FixedSizeBinary<20>],
      undefined,
      true,
      never
    >;
  };
  DynamicEvmFee: {
    /**
     * Base fee per gas
     */
    BaseFeePerGas: StorageDescriptor<
      [],
      Anonymize<I4totqt881mlti>,
      false,
      never
    >;
  };
  XYKWarehouseLM: {
    /**
     * Id sequencer for `GlobalFarm` and `YieldFarm`.
     */
    FarmSequencer: StorageDescriptor<[], number, false, never>;
    /**
        
         */
    DepositSequencer: StorageDescriptor<[], bigint, false, never>;
    /**
        
         */
    GlobalFarm: StorageDescriptor<
      [Key: number],
      Anonymize<I5ugnv0dol8v8t>,
      true,
      never
    >;
    /**
     * Yield farm details.
     */
    YieldFarm: StorageDescriptor<
      Anonymize<Id32h28hjj1tch>,
      Anonymize<I1ksaufim9dq1c>,
      true,
      never
    >;
    /**
     * Deposit details.
     */
    Deposit: StorageDescriptor<
      [Key: bigint],
      Anonymize<I66gvo4ilpv28i>,
      true,
      never
    >;
    /**
     * Active(farms able to receive LP shares deposits) yield farms.
     */
    ActiveYieldFarm: StorageDescriptor<
      Anonymize<I6ouflveob4eli>,
      number,
      true,
      never
    >;
  };
  DCA: {
    /**
     * Id sequencer for schedules
     */
    ScheduleIdSequencer: StorageDescriptor<[], number, false, never>;
    /**
     * Storing schedule details
     */
    Schedules: StorageDescriptor<
      [Key: number],
      Anonymize<I2u0nucph7peo9>,
      true,
      never
    >;
    /**
     * Storing schedule ownership
     */
    ScheduleOwnership: StorageDescriptor<
      Anonymize<I6ouflveob4eli>,
      undefined,
      true,
      never
    >;
    /**
     * Keep tracking the remaining amounts to spend for DCA schedules
     */
    RemainingAmounts: StorageDescriptor<[Key: number], bigint, true, never>;
    /**
     * Keep tracking the retry on error flag for DCA schedules
     */
    RetriesOnError: StorageDescriptor<[Key: number], number, false, never>;
    /**
     * Keep tracking the blocknumber when the schedule is planned to be executed
     */
    ScheduleExecutionBlock: StorageDescriptor<
      [Key: number],
      number,
      true,
      never
    >;
    /**
     * Keep tracking of the schedule ids to be executed in the block
     */
    ScheduleIdsPerBlock: StorageDescriptor<
      [Key: number],
      Anonymize<Icgljjb6j82uhn>,
      false,
      never
    >;
  };
  Scheduler: {
    /**
        
         */
    IncompleteSince: StorageDescriptor<[], number, true, never>;
    /**
     * Items to be executed, indexed by the block number that they should be executed on.
     */
    Agenda: StorageDescriptor<
      [Key: number],
      Anonymize<Id2tibj9h7evc8>,
      false,
      never
    >;
    /**
     * Retry configurations for items to be executed, indexed by task address.
     */
    Retries: StorageDescriptor<
      [Key: Anonymize<I9jd27rnpm8ttv>],
      Anonymize<I56u24ncejr5kt>,
      true,
      never
    >;
    /**
     * Lookup from a name to the block number and index of the task.
     *
     * For v3 -> v4 the previously unbounded identities are Blake2-256 hashed to form the v4
     * identities.
     */
    Lookup: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      Anonymize<I9jd27rnpm8ttv>,
      true,
      never
    >;
  };
  ParachainSystem: {
    /**
     * Latest included block descendants the runtime accepted. In other words, these are
     * ancestors of the currently executing block which have not been included in the observed
     * relay-chain state.
     *
     * The segment length is limited by the capacity returned from the [`ConsensusHook`] configured
     * in the pallet.
     */
    UnincludedSegment: StorageDescriptor<
      [],
      Anonymize<I1v7jbnil3tjns>,
      false,
      never
    >;
    /**
     * Storage field that keeps track of bandwidth used by the unincluded segment along with the
     * latest HRMP watermark. Used for limiting the acceptance of new blocks with
     * respect to relay chain constraints.
     */
    AggregatedUnincludedSegment: StorageDescriptor<
      [],
      Anonymize<I8jgj1nhcr2dg8>,
      true,
      never
    >;
    /**
     * In case of a scheduled upgrade, this storage field contains the validation code to be
     * applied.
     *
     * As soon as the relay chain gives us the go-ahead signal, we will overwrite the
     * [`:code`][sp_core::storage::well_known_keys::CODE] which will result the next block process
     * with the new validation code. This concludes the upgrade process.
     */
    PendingValidationCode: StorageDescriptor<[], Binary, false, never>;
    /**
     * Validation code that is set by the parachain and is to be communicated to collator and
     * consequently the relay-chain.
     *
     * This will be cleared in `on_initialize` of each new block if no other pallet already set
     * the value.
     */
    NewValidationCode: StorageDescriptor<[], Binary, true, never>;
    /**
     * The [`PersistedValidationData`] set for this block.
     * This value is expected to be set only once per block and it's never stored
     * in the trie.
     */
    ValidationData: StorageDescriptor<
      [],
      Anonymize<Ifn6q3equiq9qi>,
      true,
      never
    >;
    /**
     * Were the validation data set to notify the relay chain?
     */
    DidSetValidationCode: StorageDescriptor<[], boolean, false, never>;
    /**
     * The relay chain block number associated with the last parachain block.
     *
     * This is updated in `on_finalize`.
     */
    LastRelayChainBlockNumber: StorageDescriptor<[], number, false, never>;
    /**
     * An option which indicates if the relay-chain restricts signalling a validation code upgrade.
     * In other words, if this is `Some` and [`NewValidationCode`] is `Some` then the produced
     * candidate will be invalid.
     *
     * This storage item is a mirror of the corresponding value for the current parachain from the
     * relay-chain. This value is ephemeral which means it doesn't hit the storage. This value is
     * set after the inherent.
     */
    UpgradeRestrictionSignal: StorageDescriptor<
      [],
      Anonymize<Ia3sb0vgvovhtg>,
      false,
      never
    >;
    /**
     * Optional upgrade go-ahead signal from the relay-chain.
     *
     * This storage item is a mirror of the corresponding value for the current parachain from the
     * relay-chain. This value is ephemeral which means it doesn't hit the storage. This value is
     * set after the inherent.
     */
    UpgradeGoAhead: StorageDescriptor<
      [],
      Anonymize<Iav8k1edbj86k7>,
      false,
      never
    >;
    /**
     * The state proof for the last relay parent block.
     *
     * This field is meant to be updated each block with the validation data inherent. Therefore,
     * before processing of the inherent, e.g. in `on_initialize` this data may be stale.
     *
     * This data is also absent from the genesis.
     */
    RelayStateProof: StorageDescriptor<
      [],
      Anonymize<Itom7fk49o0c9>,
      true,
      never
    >;
    /**
     * The snapshot of some state related to messaging relevant to the current parachain as per
     * the relay parent.
     *
     * This field is meant to be updated each block with the validation data inherent. Therefore,
     * before processing of the inherent, e.g. in `on_initialize` this data may be stale.
     *
     * This data is also absent from the genesis.
     */
    RelevantMessagingState: StorageDescriptor<
      [],
      Anonymize<I4i91h98n3cv1b>,
      true,
      never
    >;
    /**
     * The parachain host configuration that was obtained from the relay parent.
     *
     * This field is meant to be updated each block with the validation data inherent. Therefore,
     * before processing of the inherent, e.g. in `on_initialize` this data may be stale.
     *
     * This data is also absent from the genesis.
     */
    HostConfiguration: StorageDescriptor<
      [],
      Anonymize<I4iumukclgj8ej>,
      true,
      never
    >;
    /**
     * The last downward message queue chain head we have observed.
     *
     * This value is loaded before and saved after processing inbound downward messages carried
     * by the system inherent.
     */
    LastDmqMqcHead: StorageDescriptor<[], FixedSizeBinary<32>, false, never>;
    /**
     * The message queue chain heads we have observed per each channel incoming channel.
     *
     * This value is loaded before and saved after processing inbound downward messages carried
     * by the system inherent.
     */
    LastHrmpMqcHeads: StorageDescriptor<
      [],
      Anonymize<Iqnbvitf7a7l3>,
      false,
      never
    >;
    /**
     * Number of downward messages processed in a block.
     *
     * This will be cleared in `on_initialize` of each new block.
     */
    ProcessedDownwardMessages: StorageDescriptor<[], number, false, never>;
    /**
     * HRMP watermark that was set in a block.
     *
     * This will be cleared in `on_initialize` of each new block.
     */
    HrmpWatermark: StorageDescriptor<[], number, false, never>;
    /**
     * HRMP messages that were sent in a block.
     *
     * This will be cleared in `on_initialize` of each new block.
     */
    HrmpOutboundMessages: StorageDescriptor<
      [],
      Anonymize<I6r5cbv8ttrb09>,
      false,
      never
    >;
    /**
     * Upward messages that were sent in a block.
     *
     * This will be cleared in `on_initialize` of each new block.
     */
    UpwardMessages: StorageDescriptor<
      [],
      Anonymize<Itom7fk49o0c9>,
      false,
      never
    >;
    /**
     * Upward messages that are still pending and not yet send to the relay chain.
     */
    PendingUpwardMessages: StorageDescriptor<
      [],
      Anonymize<Itom7fk49o0c9>,
      false,
      never
    >;
    /**
     * The factor to multiply the base delivery fee by for UMP.
     */
    UpwardDeliveryFeeFactor: StorageDescriptor<[], bigint, false, never>;
    /**
     * The number of HRMP messages we observed in `on_initialize` and thus used that number for
     * announcing the weight of `on_initialize` and `on_finalize`.
     */
    AnnouncedHrmpMessagesPerCandidate: StorageDescriptor<
      [],
      number,
      false,
      never
    >;
    /**
     * The weight we reserve at the beginning of the block for processing XCMP messages. This
     * overrides the amount set in the Config trait.
     */
    ReservedXcmpWeightOverride: StorageDescriptor<
      [],
      Anonymize<I4q39t5hn830vp>,
      true,
      never
    >;
    /**
     * The weight we reserve at the beginning of the block for processing DMP messages. This
     * overrides the amount set in the Config trait.
     */
    ReservedDmpWeightOverride: StorageDescriptor<
      [],
      Anonymize<I4q39t5hn830vp>,
      true,
      never
    >;
    /**
     * A custom head data that should be returned as result of `validate_block`.
     *
     * See `Pallet::set_custom_validation_head_data` for more information.
     */
    CustomValidationHeadData: StorageDescriptor<[], Binary, true, never>;
  };
  ParachainInfo: {
    /**
        
         */
    ParachainId: StorageDescriptor<[], number, false, never>;
  };
  PolkadotXcm: {
    /**
     * The latest available query index.
     */
    QueryCounter: StorageDescriptor<[], bigint, false, never>;
    /**
     * The ongoing queries.
     */
    Queries: StorageDescriptor<
      [Key: bigint],
      XcmPalletQueryStatus,
      true,
      never
    >;
    /**
     * The existing asset traps.
     *
     * Key is the blake2 256 hash of (origin, versioned `Assets`) pair. Value is the number of
     * times this pair has been trapped (usually just 1 if it exists at all).
     */
    AssetTraps: StorageDescriptor<
      [Key: FixedSizeBinary<32>],
      number,
      false,
      never
    >;
    /**
     * Default version to encode XCM when latest version of destination is unknown. If `None`,
     * then the destinations whose XCM version is unknown are considered unreachable.
     */
    SafeXcmVersion: StorageDescriptor<[], number, true, never>;
    /**
     * The Latest versions that we know various locations support.
     */
    SupportedVersion: StorageDescriptor<
      Anonymize<Ic4qvh5df9s5gp>,
      number,
      true,
      never
    >;
    /**
     * All locations that we have requested version notifications from.
     */
    VersionNotifiers: StorageDescriptor<
      Anonymize<Ic4qvh5df9s5gp>,
      bigint,
      true,
      never
    >;
    /**
     * The target locations that are subscribed to our version changes, as well as the most recent
     * of our versions we informed them of.
     */
    VersionNotifyTargets: StorageDescriptor<
      Anonymize<Ic4qvh5df9s5gp>,
      Anonymize<I7vlvrrl2pnbgk>,
      true,
      never
    >;
    /**
     * Destinations whose latest XCM version we would like to know. Duplicates not allowed, and
     * the `u32` counter is the number of times that a send to the destination has been attempted,
     * which is used as a prioritization.
     */
    VersionDiscoveryQueue: StorageDescriptor<
      [],
      Anonymize<I50sjs3s5lud21>,
      false,
      never
    >;
    /**
     * The current migration's stage, if any.
     */
    CurrentMigration: StorageDescriptor<
      [],
      XcmPalletVersionMigrationStage,
      true,
      never
    >;
    /**
     * Fungible assets which we know are locked on a remote chain.
     */
    RemoteLockedFungibles: StorageDescriptor<
      Anonymize<Iteuj23is2ed5>,
      Anonymize<I50qp0ij7h62g2>,
      true,
      never
    >;
    /**
     * Fungible assets which we know are locked on this chain.
     */
    LockedFungibles: StorageDescriptor<
      [Key: SS58String],
      Anonymize<I3rp19gb4dadaa>,
      true,
      never
    >;
    /**
     * Global suspension state of the XCM executor.
     */
    XcmExecutionSuspended: StorageDescriptor<[], boolean, false, never>;
  };
  XcmpQueue: {
    /**
     * The suspended inbound XCMP channels. All others are not suspended.
     *
     * This is a `StorageValue` instead of a `StorageMap` since we expect multiple reads per block
     * to different keys with a one byte payload. The access to `BoundedBTreeSet` will be cached
     * within the block and therefore only included once in the proof size.
     *
     * NOTE: The PoV benchmarking cannot know this and will over-estimate, but the actual proof
     * will be smaller.
     */
    InboundXcmpSuspended: StorageDescriptor<
      [],
      Anonymize<Icgljjb6j82uhn>,
      false,
      never
    >;
    /**
     * The non-empty XCMP channels in order of becoming non-empty, and the index of the first
     * and last outbound message. If the two indices are equal, then it indicates an empty
     * queue and there must be a non-`Ok` `OutboundStatus`. We assume queues grow no greater
     * than 65535 items. Queue indices for normal messages begin at one; zero is reserved in
     * case of the need to send a high-priority signal message this block.
     * The bool is true if there is a signal message waiting to be sent.
     */
    OutboundXcmpStatus: StorageDescriptor<
      [],
      Anonymize<Ib77b0fp1a6mjr>,
      false,
      never
    >;
    /**
     * The messages outbound in a given XCMP channel.
     */
    OutboundXcmpMessages: StorageDescriptor<
      Anonymize<I5g2vv0ckl2m8b>,
      Binary,
      false,
      never
    >;
    /**
     * Any signal messages waiting to be sent.
     */
    SignalMessages: StorageDescriptor<[Key: number], Binary, false, never>;
    /**
     * The configuration which controls the dynamics of the outbound queue.
     */
    QueueConfig: StorageDescriptor<[], Anonymize<Ifup3lg9ro8a0f>, false, never>;
    /**
     * Whether or not the XCMP queue is suspended from executing incoming XCMs or not.
     */
    QueueSuspended: StorageDescriptor<[], boolean, false, never>;
    /**
     * The factor to multiply the base delivery fee by.
     */
    DeliveryFeeFactor: StorageDescriptor<[Key: number], bigint, false, never>;
  };
  MessageQueue: {
    /**
     * The index of the first and last (non-empty) pages.
     */
    BookStateFor: StorageDescriptor<
      [Key: Anonymize<Iejeo53sea6n4q>],
      Anonymize<Idh2ug6ou4a8og>,
      false,
      never
    >;
    /**
     * The origin at which we should begin servicing.
     */
    ServiceHead: StorageDescriptor<[], Anonymize<Iejeo53sea6n4q>, true, never>;
    /**
     * The map of page indices to pages.
     */
    Pages: StorageDescriptor<
      Anonymize<Ib4jhb8tt3uung>,
      Anonymize<I53esa2ms463bk>,
      true,
      never
    >;
  };
  UnknownTokens: {
    /**
     * Concrete fungible balances under a given location and a concrete
     * fungible id.
     *
     * double_map: who, asset_id => u128
     */
    ConcreteFungibleBalances: StorageDescriptor<
      Anonymize<Id0as9l3s817qs>,
      bigint,
      false,
      never
    >;
    /**
     * Abstract fungible balances under a given location and a abstract
     * fungible id.
     *
     * double_map: who, asset_id => u128
     */
    AbstractFungibleBalances: StorageDescriptor<
      Anonymize<Ifmurjhsco5svb>,
      bigint,
      false,
      never
    >;
  };
  Authorship: {
    /**
     * Author of current block.
     */
    Author: StorageDescriptor<[], SS58String, true, never>;
  };
  CollatorSelection: {
    /**
     * The invulnerable, permissioned collators. This list must be sorted.
     */
    Invulnerables: StorageDescriptor<
      [],
      Anonymize<Ia2lhg7l2hilo3>,
      false,
      never
    >;
    /**
     * The (community, limited) collation candidates. `Candidates` and `Invulnerables` should be
     * mutually exclusive.
     *
     * This list is sorted in ascending order by deposit and when the deposits are equal, the least
     * recently updated is considered greater.
     */
    CandidateList: StorageDescriptor<
      [],
      Anonymize<Ifi4da1gej1fri>,
      false,
      never
    >;
    /**
     * Last block authored by collator.
     */
    LastAuthoredBlock: StorageDescriptor<
      [Key: SS58String],
      number,
      false,
      never
    >;
    /**
     * Desired number of candidates.
     *
     * This should ideally always be less than [`Config::MaxCandidates`] for weights to be correct.
     */
    DesiredCandidates: StorageDescriptor<[], number, false, never>;
    /**
     * Fixed amount to deposit to become a collator.
     *
     * When a collator calls `leave_intent` they immediately receive the deposit back.
     */
    CandidacyBond: StorageDescriptor<[], bigint, false, never>;
  };
  Session: {
    /**
     * The current set of validators.
     */
    Validators: StorageDescriptor<[], Anonymize<Ia2lhg7l2hilo3>, false, never>;
    /**
     * Current index of the session.
     */
    CurrentIndex: StorageDescriptor<[], number, false, never>;
    /**
     * True if the underlying economic identities or weighting behind the validators
     * has changed in the queued validator set.
     */
    QueuedChanged: StorageDescriptor<[], boolean, false, never>;
    /**
     * The queued keys for the next session. When the next session begins, these keys
     * will be used to determine the validator's session keys.
     */
    QueuedKeys: StorageDescriptor<[], Anonymize<Ifvgo9568rpmqc>, false, never>;
    /**
     * Indices of disabled validators.
     *
     * The vec is always kept sorted so that we can find whether a given validator is
     * disabled using binary search. It gets cleared when `on_session_ending` returns
     * a new set of identities.
     */
    DisabledValidators: StorageDescriptor<
      [],
      Anonymize<Icgljjb6j82uhn>,
      false,
      never
    >;
    /**
     * The next session keys for a validator.
     */
    NextKeys: StorageDescriptor<
      [Key: SS58String],
      FixedSizeBinary<32>,
      true,
      never
    >;
    /**
     * The owner of a key. The key is the `KeyTypeId` + the encoded key.
     */
    KeyOwner: StorageDescriptor<
      [Key: Anonymize<I82jm9g7pufuel>],
      SS58String,
      true,
      never
    >;
  };
  Aura: {
    /**
     * The current authority set.
     */
    Authorities: StorageDescriptor<[], Anonymize<Ic5m5lp1oioo8r>, false, never>;
    /**
     * The current slot of this block.
     *
     * This will be set in `on_initialize`.
     */
    CurrentSlot: StorageDescriptor<[], bigint, false, never>;
  };
  AuraExt: {
    /**
     * Serves as cache for the authorities.
     *
     * The authorities in AuRa are overwritten in `on_initialize` when we switch to a new session,
     * but we require the old authorities to verify the seal when validating a PoV. This will
     * always be updated to the latest AuRa authorities in `on_finalize`.
     */
    Authorities: StorageDescriptor<[], Anonymize<Ic5m5lp1oioo8r>, false, never>;
    /**
     * Current slot paired with a number of authored blocks.
     *
     * Updated on each block initialization.
     */
    SlotInfo: StorageDescriptor<[], Anonymize<I6cs1itejju2vv>, true, never>;
  };
  EmaOracle: {
    /**
     * Accumulator for oracle data in current block that will be recorded at the end of the block.
     */
    Accumulator: StorageDescriptor<[], Anonymize<I7dp637m60bg7s>, false, never>;
    /**
     * Oracle storage keyed by data source, involved asset ids and the period length of the oracle.
     *
     * Stores the data entry as well as the block number when the oracle was first initialized.
     */
    Oracles: StorageDescriptor<
      Anonymize<I1os9h4ivict7u>,
      Anonymize<Ifmar1ir5rft6l>,
      true,
      never
    >;
    /**
     * Assets that are whitelisted and tracked by the pallet.
     */
    WhitelistedAssets: StorageDescriptor<
      [],
      Anonymize<Isa48262v9oqu>,
      false,
      never
    >;
  };
  Broadcast: {
    /**
     * Next available incremental ID
     */
    IncrementalId: StorageDescriptor<[], number, false, never>;
    /**
     * Execution context to figure out where the trade is originated from
     */
    ExecutionContext: StorageDescriptor<
      [],
      Anonymize<I7k4nkfs24tj3>,
      false,
      never
    >;
    /**
     * To handle the overflow of increasing the execution context.
     * After the stack is full, we start to increase the overflow count,
     * so we how many times we can ignore the removal from the context.
     */
    OverflowCount: StorageDescriptor<[], number, false, never>;
  };
};
type ICalls = {
  System: {
    /**
     *Make some on-chain remark.
     *
     *Can be executed by every `origin`.
     */
    remark: TxDescriptor<Anonymize<I8ofcg5rbj0g2c>>;
    /**
     *Set the number of pages in the WebAssembly environment's heap.
     */
    set_heap_pages: TxDescriptor<Anonymize<I4adgbll7gku4i>>;
    /**
     *Set the new runtime code.
     */
    set_code: TxDescriptor<Anonymize<I6pjjpfvhvcfru>>;
    /**
     *Set the new runtime code without doing any checks of the given `code`.
     *
     *Note that runtime upgrades will not run if this is called with a not-increasing spec
     *version!
     */
    set_code_without_checks: TxDescriptor<Anonymize<I6pjjpfvhvcfru>>;
    /**
     *Set some items of storage.
     */
    set_storage: TxDescriptor<Anonymize<I9pj91mj79qekl>>;
    /**
     *Kill some items from storage.
     */
    kill_storage: TxDescriptor<Anonymize<I39uah9nss64h9>>;
    /**
     *Kill all storage items with a key that starts with the given prefix.
     *
     ***NOTE:** We rely on the Root origin to provide us the number of subkeys under
     *the prefix we are removing to accurately calculate the weight of this function.
     */
    kill_prefix: TxDescriptor<Anonymize<Ik64dknsq7k08>>;
    /**
     *Make some on-chain remark and emit event.
     */
    remark_with_event: TxDescriptor<Anonymize<I8ofcg5rbj0g2c>>;
    /**
     *Authorize an upgrade to a given `code_hash` for the runtime. The runtime can be supplied
     *later.
     *
     *This call requires Root origin.
     */
    authorize_upgrade: TxDescriptor<Anonymize<Ib51vk42m1po4n>>;
    /**
     *Authorize an upgrade to a given `code_hash` for the runtime. The runtime can be supplied
     *later.
     *
     *WARNING: This authorizes an upgrade that will take place without any safety checks, for
     *example that the spec name remains the same and that the version number increases. Not
     *recommended for normal use. Use `authorize_upgrade` instead.
     *
     *This call requires Root origin.
     */
    authorize_upgrade_without_checks: TxDescriptor<Anonymize<Ib51vk42m1po4n>>;
    /**
     *Provide the preimage (runtime binary) `code` for an upgrade that has been authorized.
     *
     *If the authorization required a version check, this call will ensure the spec name
     *remains unchanged and that the spec version has increased.
     *
     *Depending on the runtime's `OnSetCode` configuration, this function may directly apply
     *the new `code` in the same block or attempt to schedule the upgrade.
     *
     *All origins are allowed.
     */
    apply_authorized_upgrade: TxDescriptor<Anonymize<I6pjjpfvhvcfru>>;
  };
  Timestamp: {
    /**
     *Set the current time.
     *
     *This call should be invoked exactly once per block. It will panic at the finalization
     *phase, if this call hasn't been invoked by that time.
     *
     *The timestamp should be greater than the previous one by the amount specified by
     *[`Config::MinimumPeriod`].
     *
     *The dispatch origin for this call must be _None_.
     *
     *This dispatch class is _Mandatory_ to ensure it gets executed in the block. Be aware
     *that changing the complexity of this call could result exhausting the resources in a
     *block to execute any other calls.
     *
     *## Complexity
     *- `O(1)` (Note that implementations of `OnTimestampSet` must also be `O(1)`)
     *- 1 storage read and 1 storage mutation (codec `O(1)` because of `DidUpdate::take` in
     *  `on_finalize`)
     *- 1 event handler `on_timestamp_set`. Must be `O(1)`.
     */
    set: TxDescriptor<Anonymize<Idcr6u6361oad9>>;
  };
  Balances: {
    /**
     *Transfer some liquid free balance to another account.
     *
     *`transfer_allow_death` will set the `FreeBalance` of the sender and receiver.
     *If the sender's account is below the existential deposit as a result
     *of the transfer, the account will be reaped.
     *
     *The dispatch origin for this call must be `Signed` by the transactor.
     */
    transfer_allow_death: TxDescriptor<Anonymize<I1o12ibtjm10ot>>;
    /**
     *Exactly as `transfer_allow_death`, except the origin must be root and the source account
     *may be specified.
     */
    force_transfer: TxDescriptor<Anonymize<I8vn14j8a40qm>>;
    /**
     *Same as the [`transfer_allow_death`] call, but with a check that the transfer will not
     *kill the origin account.
     *
     *99% of the time you want [`transfer_allow_death`] instead.
     *
     *[`transfer_allow_death`]: struct.Pallet.html#method.transfer
     */
    transfer_keep_alive: TxDescriptor<Anonymize<I1o12ibtjm10ot>>;
    /**
     *Transfer the entire transferable balance from the caller account.
     *
     *NOTE: This function only attempts to transfer _transferable_ balances. This means that
     *any locked, reserved, or existential deposits (when `keep_alive` is `true`), will not be
     *transferred by this function. To ensure that this function results in a killed account,
     *you might need to prepare the account by removing any reference counters, storage
     *deposits, etc...
     *
     *The dispatch origin of this call must be Signed.
     *
     *- `dest`: The recipient of the transfer.
     *- `keep_alive`: A boolean to determine if the `transfer_all` operation should send all
     *  of the funds the account has, causing the sender account to be killed (false), or
     *  transfer everything except at least the existential deposit, which will guarantee to
     *  keep the sender account alive (true).
     */
    transfer_all: TxDescriptor<Anonymize<I493o732nahjlr>>;
    /**
     *Unreserve some balance from a user by force.
     *
     *Can only be called by ROOT.
     */
    force_unreserve: TxDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Upgrade a specified account.
     *
     *- `origin`: Must be `Signed`.
     *- `who`: The account to be upgraded.
     *
     *This will waive the transaction fee if at least all but 10% of the accounts needed to
     *be upgraded. (We let some not have to be upgraded just in order to allow for the
     *possibility of churn).
     */
    upgrade_accounts: TxDescriptor<Anonymize<Ibmr18suc9ikh9>>;
    /**
     *Set the regular balance of a given account.
     *
     *The dispatch origin for this call is `root`.
     */
    force_set_balance: TxDescriptor<Anonymize<I4og34pg4ruv5d>>;
    /**
     *Adjust the total issuance in a saturating way.
     *
     *Can only be called by root and always needs a positive `delta`.
     *
     *# Example
     */
    force_adjust_total_issuance: TxDescriptor<Anonymize<I5u8olqbbvfnvf>>;
  };
  MultiTransactionPayment: {
    /**
     *Set selected currency for given account.
     *
     *This allows to set a currency for an account in which all transaction fees will be paid.
     *Account balance cannot be zero.
     *
     *In case of sufficient asset, the chosen currency must be in the list of accepted currencies
     *In case of insufficient asset, the chosen currency must have a XYK pool with DOT
     *
     *When currency is set, fixed fee is withdrawn from the account to pay for the currency change
     *
     *EVM accounts are now allowed to change thier payment currency.
     *
     *Emits `CurrencySet` event when successful.
     */
    set_currency: TxDescriptor<Anonymize<Ic1e6uvbf8ado3>>;
    /**
     *Add a currency to the list of accepted currencies.
     *
     *Only member can perform this action.
     *
     *Currency must not be already accepted. Core asset id cannot be explicitly added.
     *
     *Emits `CurrencyAdded` event when successful.
     */
    add_currency: TxDescriptor<Anonymize<Ie7oqvfdar8r2>>;
    /**
     *Remove currency from the list of supported currencies
     *Only selected members can perform this action
     *
     *Core asset cannot be removed.
     *
     *Emits `CurrencyRemoved` when successful.
     */
    remove_currency: TxDescriptor<Anonymize<Ic1e6uvbf8ado3>>;
    /**
     *Reset currency of the specified account to HDX.
     *If the account is EVM account, the payment currency is reset to WETH.
     *Only selected members can perform this action.
     *
     *Emits `CurrencySet` when successful.
     */
    reset_payment_currency: TxDescriptor<Anonymize<I6v8sm60vvkmk7>>;
    /**
     *Dispatch EVM permit.
     *The main purpose of this function is to allow EVM accounts to pay for the transaction fee in non-native currency
     *by allowing them to self-dispatch pre-signed permit.
     *The EVM fee is paid in the currency set for the account.
     */
    dispatch_permit: TxDescriptor<Anonymize<I92pum5p0t4pat>>;
  };
  Treasury: {
    /**
     *Put forward a suggestion for spending.
     *
     *## Dispatch Origin
     *
     *Must be signed.
     *
     *## Details
     *A deposit proportional to the value is reserved and slashed if the proposal is rejected.
     *It is returned once the proposal is awarded.
     *
     *### Complexity
     *- O(1)
     *
     *## Events
     *
     *Emits [`Event::Proposed`] if successful.
     */
    propose_spend: TxDescriptor<Anonymize<I1g5tojdtkn6tu>>;
    /**
     *Reject a proposed spend.
     *
     *## Dispatch Origin
     *
     *Must be [`Config::RejectOrigin`].
     *
     *## Details
     *The original deposit will be slashed.
     *
     *### Complexity
     *- O(1)
     *
     *## Events
     *
     *Emits [`Event::Rejected`] if successful.
     */
    reject_proposal: TxDescriptor<Anonymize<Icm9m0qeemu66d>>;
    /**
     *Approve a proposal.
     *
     *## Dispatch Origin
     *
     *Must be [`Config::ApproveOrigin`].
     *
     *## Details
     *
     *At a later time, the proposal will be allocated to the beneficiary and the original
     *deposit will be returned.
     *
     *### Complexity
     * - O(1).
     *
     *## Events
     *
     *No events are emitted from this dispatch.
     */
    approve_proposal: TxDescriptor<Anonymize<Icm9m0qeemu66d>>;
    /**
     *Propose and approve a spend of treasury funds.
     *
     *## Dispatch Origin
     *
     *Must be [`Config::SpendOrigin`] with the `Success` value being at least `amount`.
     *
     *### Details
     *NOTE: For record-keeping purposes, the proposer is deemed to be equivalent to the
     *beneficiary.
     *
     *### Parameters
     *- `amount`: The amount to be transferred from the treasury to the `beneficiary`.
     *- `beneficiary`: The destination account for the transfer.
     *
     *## Events
     *
     *Emits [`Event::SpendApproved`] if successful.
     */
    spend_local: TxDescriptor<Anonymize<Idscf6boak49q1>>;
    /**
     *Force a previously approved proposal to be removed from the approval queue.
     *
     *## Dispatch Origin
     *
     *Must be [`Config::RejectOrigin`].
     *
     *## Details
     *
     *The original deposit will no longer be returned.
     *
     *### Parameters
     *- `proposal_id`: The index of a proposal
     *
     *### Complexity
     *- O(A) where `A` is the number of approvals
     *
     *### Errors
     *- [`Error::ProposalNotApproved`]: The `proposal_id` supplied was not found in the
     *  approval queue, i.e., the proposal has not been approved. This could also mean the
     *  proposal does not exist altogether, thus there is no way it would have been approved
     *  in the first place.
     */
    remove_approval: TxDescriptor<Anonymize<Icm9m0qeemu66d>>;
    /**
     *Propose and approve a spend of treasury funds.
     *
     *## Dispatch Origin
     *
     *Must be [`Config::SpendOrigin`] with the `Success` value being at least
     *`amount` of `asset_kind` in the native asset. The amount of `asset_kind` is converted
     *for assertion using the [`Config::BalanceConverter`].
     *
     *## Details
     *
     *Create an approved spend for transferring a specific `amount` of `asset_kind` to a
     *designated beneficiary. The spend must be claimed using the `payout` dispatchable within
     *the [`Config::PayoutPeriod`].
     *
     *### Parameters
     *- `asset_kind`: An indicator of the specific asset class to be spent.
     *- `amount`: The amount to be transferred from the treasury to the `beneficiary`.
     *- `beneficiary`: The beneficiary of the spend.
     *- `valid_from`: The block number from which the spend can be claimed. It can refer to
     *  the past if the resulting spend has not yet expired according to the
     *  [`Config::PayoutPeriod`]. If `None`, the spend can be claimed immediately after
     *  approval.
     *
     *## Events
     *
     *Emits [`Event::AssetSpendApproved`] if successful.
     */
    spend: TxDescriptor<Anonymize<I6qq5nnbjegi8u>>;
    /**
     *Claim a spend.
     *
     *## Dispatch Origin
     *
     *Must be signed.
     *
     *## Details
     *
     *Spends must be claimed within some temporal bounds. A spend may be claimed within one
     *[`Config::PayoutPeriod`] from the `valid_from` block.
     *In case of a payout failure, the spend status must be updated with the `check_status`
     *dispatchable before retrying with the current function.
     *
     *### Parameters
     *- `index`: The spend index.
     *
     *## Events
     *
     *Emits [`Event::Paid`] if successful.
     */
    payout: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *Check the status of the spend and remove it from the storage if processed.
     *
     *## Dispatch Origin
     *
     *Must be signed.
     *
     *## Details
     *
     *The status check is a prerequisite for retrying a failed payout.
     *If a spend has either succeeded or expired, it is removed from the storage by this
     *function. In such instances, transaction fees are refunded.
     *
     *### Parameters
     *- `index`: The spend index.
     *
     *## Events
     *
     *Emits [`Event::PaymentFailed`] if the spend payout has failed.
     *Emits [`Event::SpendProcessed`] if the spend payout has succeed.
     */
    check_status: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *Void previously approved spend.
     *
     *## Dispatch Origin
     *
     *Must be [`Config::RejectOrigin`].
     *
     *## Details
     *
     *A spend void is only possible if the payout has not been attempted yet.
     *
     *### Parameters
     *- `index`: The spend index.
     *
     *## Events
     *
     *Emits [`Event::AssetSpendVoided`] if successful.
     */
    void_spend: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
  };
  Utility: {
    /**
     *Send a batch of dispatch calls.
     *
     *May be called from any origin except `None`.
     *
     *- `calls`: The calls to be dispatched from the same origin. The number of call must not
     *  exceed the constant: `batched_calls_limit` (available in constant metadata).
     *
     *If origin is root then the calls are dispatched without checking origin filter. (This
     *includes bypassing `frame_system::Config::BaseCallFilter`).
     *
     *## Complexity
     *- O(C) where C is the number of calls to be batched.
     *
     *This will return `Ok` in all circumstances. To determine the success of the batch, an
     *event is deposited. If a call failed and the batch was interrupted, then the
     *`BatchInterrupted` event is deposited, along with the number of successful calls made
     *and the error of the failed call. If all were successful, then the `BatchCompleted`
     *event is deposited.
     */
    batch: TxDescriptor<Anonymize<Ibvmpv5kha43st>>;
    /**
     *Send a call through an indexed pseudonym of the sender.
     *
     *Filter from origin are passed along. The call will be dispatched with an origin which
     *use the same filter as the origin of this call.
     *
     *NOTE: If you need to ensure that any account-based filtering is not honored (i.e.
     *because you expect `proxy` to have been used prior in the call stack and you do not want
     *the call restrictions to apply to any sub-accounts), then use `as_multi_threshold_1`
     *in the Multisig pallet instead.
     *
     *NOTE: Prior to version *12, this was called `as_limited_sub`.
     *
     *The dispatch origin for this call must be _Signed_.
     */
    as_derivative: TxDescriptor<Anonymize<Ic30ooaln1e62m>>;
    /**
     *Send a batch of dispatch calls and atomically execute them.
     *The whole transaction will rollback and fail if any of the calls failed.
     *
     *May be called from any origin except `None`.
     *
     *- `calls`: The calls to be dispatched from the same origin. The number of call must not
     *  exceed the constant: `batched_calls_limit` (available in constant metadata).
     *
     *If origin is root then the calls are dispatched without checking origin filter. (This
     *includes bypassing `frame_system::Config::BaseCallFilter`).
     *
     *## Complexity
     *- O(C) where C is the number of calls to be batched.
     */
    batch_all: TxDescriptor<Anonymize<Ibvmpv5kha43st>>;
    /**
     *Dispatches a function call with a provided origin.
     *
     *The dispatch origin for this call must be _Root_.
     *
     *## Complexity
     *- O(1).
     */
    dispatch_as: TxDescriptor<Anonymize<Ifc9cjhms1f6t5>>;
    /**
     *Send a batch of dispatch calls.
     *Unlike `batch`, it allows errors and won't interrupt.
     *
     *May be called from any origin except `None`.
     *
     *- `calls`: The calls to be dispatched from the same origin. The number of call must not
     *  exceed the constant: `batched_calls_limit` (available in constant metadata).
     *
     *If origin is root then the calls are dispatch without checking origin filter. (This
     *includes bypassing `frame_system::Config::BaseCallFilter`).
     *
     *## Complexity
     *- O(C) where C is the number of calls to be batched.
     */
    force_batch: TxDescriptor<Anonymize<Ibvmpv5kha43st>>;
    /**
     *Dispatch a function call with a specified weight.
     *
     *This function does not check the weight of the call, and instead allows the
     *Root origin to specify the weight of the call.
     *
     *The dispatch origin for this call must be _Root_.
     */
    with_weight: TxDescriptor<Anonymize<I21uv2pp95ebqd>>;
  };
  Preimage: {
    /**
     *Register a preimage on-chain.
     *
     *If the preimage was previously requested, no fees or deposits are taken for providing
     *the preimage. Otherwise, a deposit is taken proportional to the size of the preimage.
     */
    note_preimage: TxDescriptor<Anonymize<I82nfqfkd48n10>>;
    /**
     *Clear an unrequested preimage from the runtime storage.
     *
     *If `len` is provided, then it will be a much cheaper operation.
     *
     *- `hash`: The hash of the preimage to be removed from the store.
     *- `len`: The length of the preimage of `hash`.
     */
    unnote_preimage: TxDescriptor<Anonymize<I1jm8m1rh9e20v>>;
    /**
     *Request a preimage be uploaded to the chain without paying any fees or deposits.
     *
     *If the preimage requests has already been provided on-chain, we unreserve any deposit
     *a user may have paid, and take the control of the preimage out of their hands.
     */
    request_preimage: TxDescriptor<Anonymize<I1jm8m1rh9e20v>>;
    /**
     *Clear a previously made request for a preimage.
     *
     *NOTE: THIS MUST NOT BE CALLED ON `hash` MORE TIMES THAN `request_preimage`.
     */
    unrequest_preimage: TxDescriptor<Anonymize<I1jm8m1rh9e20v>>;
    /**
     *Ensure that the a bulk of pre-images is upgraded.
     *
     *The caller pays no fee if at least 90% of pre-images were successfully updated.
     */
    ensure_updated: TxDescriptor<Anonymize<I3o5j3bli1pd8e>>;
  };
  Identity: {
    /**
     *Add a registrar to the system.
     *
     *The dispatch origin for this call must be `T::RegistrarOrigin`.
     *
     *- `account`: the account of the registrar.
     *
     *Emits `RegistrarAdded` if successful.
     */
    add_registrar: TxDescriptor<Anonymize<Icbccs0ug47ilf>>;
    /**
     *Set an account's identity information and reserve the appropriate deposit.
     *
     *If the account already has identity information, the deposit is taken as part payment
     *for the new deposit.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *- `info`: The identity information.
     *
     *Emits `IdentitySet` if successful.
     */
    set_identity: TxDescriptor<Anonymize<I2kds5jji7slh8>>;
    /**
     *Set the sub-accounts of the sender.
     *
     *Payment: Any aggregate balance reserved by previous `set_subs` calls will be returned
     *and an amount `SubAccountDeposit` will be reserved for each item in `subs`.
     *
     *The dispatch origin for this call must be _Signed_ and the sender must have a registered
     *identity.
     *
     *- `subs`: The identity's (new) sub-accounts.
     */
    set_subs: TxDescriptor<Anonymize<Ia9mkdf6l44shb>>;
    /**
     *Clear an account's identity info and all sub-accounts and return all deposits.
     *
     *Payment: All reserved balances on the account are returned.
     *
     *The dispatch origin for this call must be _Signed_ and the sender must have a registered
     *identity.
     *
     *Emits `IdentityCleared` if successful.
     */
    clear_identity: TxDescriptor<undefined>;
    /**
     *Request a judgement from a registrar.
     *
     *Payment: At most `max_fee` will be reserved for payment to the registrar if judgement
     *given.
     *
     *The dispatch origin for this call must be _Signed_ and the sender must have a
     *registered identity.
     *
     *- `reg_index`: The index of the registrar whose judgement is requested.
     *- `max_fee`: The maximum fee that may be paid. This should just be auto-populated as:
     *
     *```nocompile
     *Self::registrars().get(reg_index).unwrap().fee
     *```
     *
     *Emits `JudgementRequested` if successful.
     */
    request_judgement: TxDescriptor<Anonymize<I9l2s4klu0831o>>;
    /**
     *Cancel a previous request.
     *
     *Payment: A previously reserved deposit is returned on success.
     *
     *The dispatch origin for this call must be _Signed_ and the sender must have a
     *registered identity.
     *
     *- `reg_index`: The index of the registrar whose judgement is no longer requested.
     *
     *Emits `JudgementUnrequested` if successful.
     */
    cancel_request: TxDescriptor<Anonymize<I2ctrt5nqb8o7c>>;
    /**
     *Set the fee required for a judgement to be requested from a registrar.
     *
     *The dispatch origin for this call must be _Signed_ and the sender must be the account
     *of the registrar whose index is `index`.
     *
     *- `index`: the index of the registrar whose fee is to be set.
     *- `fee`: the new fee.
     */
    set_fee: TxDescriptor<Anonymize<I711qahikocb1c>>;
    /**
     *Change the account associated with a registrar.
     *
     *The dispatch origin for this call must be _Signed_ and the sender must be the account
     *of the registrar whose index is `index`.
     *
     *- `index`: the index of the registrar whose fee is to be set.
     *- `new`: the new account ID.
     */
    set_account_id: TxDescriptor<Anonymize<I93c18nim2s66c>>;
    /**
     *Set the field information for a registrar.
     *
     *The dispatch origin for this call must be _Signed_ and the sender must be the account
     *of the registrar whose index is `index`.
     *
     *- `index`: the index of the registrar whose fee is to be set.
     *- `fields`: the fields that the registrar concerns themselves with.
     */
    set_fields: TxDescriptor<Anonymize<Id6gojh30v9ib2>>;
    /**
     *Provide a judgement for an account's identity.
     *
     *The dispatch origin for this call must be _Signed_ and the sender must be the account
     *of the registrar whose index is `reg_index`.
     *
     *- `reg_index`: the index of the registrar whose judgement is being made.
     *- `target`: the account whose identity the judgement is upon. This must be an account
     *  with a registered identity.
     *- `judgement`: the judgement of the registrar of index `reg_index` about `target`.
     *- `identity`: The hash of the [`IdentityInformationProvider`] for that the judgement is
     *  provided.
     *
     *Note: Judgements do not apply to a username.
     *
     *Emits `JudgementGiven` if successful.
     */
    provide_judgement: TxDescriptor<Anonymize<Ica5n28rlj0lk6>>;
    /**
     *Remove an account's identity and sub-account information and slash the deposits.
     *
     *Payment: Reserved balances from `set_subs` and `set_identity` are slashed and handled by
     *`Slash`. Verification request deposits are not returned; they should be cancelled
     *manually using `cancel_request`.
     *
     *The dispatch origin for this call must match `T::ForceOrigin`.
     *
     *- `target`: the account whose identity the judgement is upon. This must be an account
     *  with a registered identity.
     *
     *Emits `IdentityKilled` if successful.
     */
    kill_identity: TxDescriptor<Anonymize<I14p0q0qs0fqbj>>;
    /**
     *Add the given account to the sender's subs.
     *
     *Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
     *to the sender.
     *
     *The dispatch origin for this call must be _Signed_ and the sender must have a registered
     *sub identity of `sub`.
     */
    add_sub: TxDescriptor<Anonymize<Ie3u4phm019a8l>>;
    /**
     *Alter the associated name of the given sub-account.
     *
     *The dispatch origin for this call must be _Signed_ and the sender must have a registered
     *sub identity of `sub`.
     */
    rename_sub: TxDescriptor<Anonymize<Ie3u4phm019a8l>>;
    /**
     *Remove the given account from the sender's subs.
     *
     *Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
     *to the sender.
     *
     *The dispatch origin for this call must be _Signed_ and the sender must have a registered
     *sub identity of `sub`.
     */
    remove_sub: TxDescriptor<Anonymize<I9jie72r7q6717>>;
    /**
     *Remove the sender as a sub-account.
     *
     *Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
     *to the sender (*not* the original depositor).
     *
     *The dispatch origin for this call must be _Signed_ and the sender must have a registered
     *super-identity.
     *
     *NOTE: This should not normally be used, but is provided in the case that the non-
     *controller of an account is maliciously registered as a sub-account.
     */
    quit_sub: TxDescriptor<undefined>;
    /**
     *Add an `AccountId` with permission to grant usernames with a given `suffix` appended.
     *
     *The authority can grant up to `allocation` usernames. To top up their allocation, they
     *should just issue (or request via governance) a new `add_username_authority` call.
     */
    add_username_authority: TxDescriptor<Anonymize<I3alo542n0mgp>>;
    /**
     *Remove `authority` from the username authorities.
     */
    remove_username_authority: TxDescriptor<Anonymize<I2rg5btjrsqec0>>;
    /**
     *Set the username for `who`. Must be called by a username authority.
     *
     *The authority must have an `allocation`. Users can either pre-sign their usernames or
     *accept them later.
     *
     *Usernames must:
     *  - Only contain lowercase ASCII characters or digits.
     *  - When combined with the suffix of the issuing authority be _less than_ the
     *    `MaxUsernameLength`.
     */
    set_username_for: TxDescriptor<Anonymize<I21r37il499a97>>;
    /**
     *Accept a given username that an `authority` granted. The call must include the full
     *username, as in `username.suffix`.
     */
    accept_username: TxDescriptor<Anonymize<Ie5l999tf7t2te>>;
    /**
     *Remove an expired username approval. The username was approved by an authority but never
     *accepted by the user and must now be beyond its expiration. The call must include the
     *full username, as in `username.suffix`.
     */
    remove_expired_approval: TxDescriptor<Anonymize<Ie5l999tf7t2te>>;
    /**
     *Set a given username as the primary. The username should include the suffix.
     */
    set_primary_username: TxDescriptor<Anonymize<Ie5l999tf7t2te>>;
    /**
     *Remove a username that corresponds to an account with no identity. Exists when a user
     *gets a username but then calls `clear_identity`.
     */
    remove_dangling_username: TxDescriptor<Anonymize<Ie5l999tf7t2te>>;
  };
  Democracy: {
    /**
     *Propose a sensitive action to be taken.
     *
     *The dispatch origin of this call must be _Signed_ and the sender must
     *have funds to cover the deposit.
     *
     *- `proposal_hash`: The hash of the proposal preimage.
     *- `value`: The amount of deposit (must be at least `MinimumDeposit`).
     *
     *Emits `Proposed`.
     */
    propose: TxDescriptor<Anonymize<I1moso5oagpiea>>;
    /**
     *Signals agreement with a particular proposal.
     *
     *The dispatch origin of this call must be _Signed_ and the sender
     *must have funds to cover the deposit, equal to the original deposit.
     *
     *- `proposal`: The index of the proposal to second.
     */
    second: TxDescriptor<Anonymize<Ibeb4n9vpjefp3>>;
    /**
     *Vote in a referendum. If `vote.is_aye()`, the vote is to enact the proposal;
     *otherwise it is a vote to keep the status quo.
     *
     *The dispatch origin of this call must be _Signed_.
     *
     *- `ref_index`: The index of the referendum to vote for.
     *- `vote`: The vote configuration.
     */
    vote: TxDescriptor<Anonymize<Id7murq9s9fg6h>>;
    /**
     *Schedule an emergency cancellation of a referendum. Cannot happen twice to the same
     *referendum.
     *
     *The dispatch origin of this call must be `CancellationOrigin`.
     *
     *-`ref_index`: The index of the referendum to cancel.
     *
     *Weight: `O(1)`.
     */
    emergency_cancel: TxDescriptor<Anonymize<Ied9mja4bq7va8>>;
    /**
     *Schedule a referendum to be tabled once it is legal to schedule an external
     *referendum.
     *
     *The dispatch origin of this call must be `ExternalOrigin`.
     *
     *- `proposal_hash`: The preimage hash of the proposal.
     */
    external_propose: TxDescriptor<Anonymize<I4f7jul8ljs54r>>;
    /**
     *Schedule a majority-carries referendum to be tabled next once it is legal to schedule
     *an external referendum.
     *
     *The dispatch of this call must be `ExternalMajorityOrigin`.
     *
     *- `proposal_hash`: The preimage hash of the proposal.
     *
     *Unlike `external_propose`, blacklisting has no effect on this and it may replace a
     *pre-scheduled `external_propose` call.
     *
     *Weight: `O(1)`
     */
    external_propose_majority: TxDescriptor<Anonymize<I4f7jul8ljs54r>>;
    /**
     *Schedule a negative-turnout-bias referendum to be tabled next once it is legal to
     *schedule an external referendum.
     *
     *The dispatch of this call must be `ExternalDefaultOrigin`.
     *
     *- `proposal_hash`: The preimage hash of the proposal.
     *
     *Unlike `external_propose`, blacklisting has no effect on this and it may replace a
     *pre-scheduled `external_propose` call.
     *
     *Weight: `O(1)`
     */
    external_propose_default: TxDescriptor<Anonymize<I4f7jul8ljs54r>>;
    /**
     *Schedule the currently externally-proposed majority-carries referendum to be tabled
     *immediately. If there is no externally-proposed referendum currently, or if there is one
     *but it is not a majority-carries referendum then it fails.
     *
     *The dispatch of this call must be `FastTrackOrigin`.
     *
     *- `proposal_hash`: The hash of the current external proposal.
     *- `voting_period`: The period that is allowed for voting on this proposal. Increased to
     *	Must be always greater than zero.
     *	For `FastTrackOrigin` must be equal or greater than `FastTrackVotingPeriod`.
     *- `delay`: The number of block after voting has ended in approval and this should be
     *  enacted. This doesn't have a minimum amount.
     *
     *Emits `Started`.
     *
     *Weight: `O(1)`
     */
    fast_track: TxDescriptor<Anonymize<I5agg650597e49>>;
    /**
     *Veto and blacklist the external proposal hash.
     *
     *The dispatch origin of this call must be `VetoOrigin`.
     *
     *- `proposal_hash`: The preimage hash of the proposal to veto and blacklist.
     *
     *Emits `Vetoed`.
     *
     *Weight: `O(V + log(V))` where V is number of `existing vetoers`
     */
    veto_external: TxDescriptor<Anonymize<I2ev73t79f46tb>>;
    /**
     *Remove a referendum.
     *
     *The dispatch origin of this call must be _Root_.
     *
     *- `ref_index`: The index of the referendum to cancel.
     *
     *# Weight: `O(1)`.
     */
    cancel_referendum: TxDescriptor<Anonymize<Ied9mja4bq7va8>>;
    /**
     *Delegate the voting power (with some given conviction) of the sending account.
     *
     *The balance delegated is locked for as long as it's delegated, and thereafter for the
     *time appropriate for the conviction's lock period.
     *
     *The dispatch origin of this call must be _Signed_, and the signing account must either:
     *  - be delegating already; or
     *  - have no voting activity (if there is, then it will need to be removed/consolidated
     *    through `reap_vote` or `unvote`).
     *
     *- `to`: The account whose voting the `target` account's voting power will follow.
     *- `conviction`: The conviction that will be attached to the delegated votes. When the
     *  account is undelegated, the funds will be locked for the corresponding period.
     *- `balance`: The amount of the account's balance to be used in delegating. This must not
     *  be more than the account's current balance.
     *
     *Emits `Delegated`.
     *
     *Weight: `O(R)` where R is the number of referendums the voter delegating to has
     *  voted on. Weight is charged as if maximum votes.
     */
    delegate: TxDescriptor<Anonymize<Iab64mce6q91i>>;
    /**
     *Undelegate the voting power of the sending account.
     *
     *Tokens may be unlocked following once an amount of time consistent with the lock period
     *of the conviction with which the delegation was issued.
     *
     *The dispatch origin of this call must be _Signed_ and the signing account must be
     *currently delegating.
     *
     *Emits `Undelegated`.
     *
     *Weight: `O(R)` where R is the number of referendums the voter delegating to has
     *  voted on. Weight is charged as if maximum votes.
     */
    undelegate: TxDescriptor<undefined>;
    /**
     *Clears all public proposals.
     *
     *The dispatch origin of this call must be _Root_.
     *
     *Weight: `O(1)`.
     */
    clear_public_proposals: TxDescriptor<undefined>;
    /**
     *Unlock tokens that have an expired lock.
     *
     *The dispatch origin of this call must be _Signed_.
     *
     *- `target`: The account to remove the lock on.
     *
     *Weight: `O(R)` with R number of vote of target.
     */
    unlock: TxDescriptor<Anonymize<I14p0q0qs0fqbj>>;
    /**
     *Remove a vote for a referendum.
     *
     *If:
     *- the referendum was cancelled, or
     *- the referendum is ongoing, or
     *- the referendum has ended such that
     *  - the vote of the account was in opposition to the result; or
     *  - there was no conviction to the account's vote; or
     *  - the account made a split vote
     *...then the vote is removed cleanly and a following call to `unlock` may result in more
     *funds being available.
     *
     *If, however, the referendum has ended and:
     *- it finished corresponding to the vote of the account, and
     *- the account made a standard vote with conviction, and
     *- the lock period of the conviction is not over
     *...then the lock will be aggregated into the overall account's lock, which may involve
     **overlocking* (where the two locks are combined into a single lock that is the maximum
     *of both the amount locked and the time is it locked for).
     *
     *The dispatch origin of this call must be _Signed_, and the signer must have a vote
     *registered for referendum `index`.
     *
     *- `index`: The index of referendum of the vote to be removed.
     *
     *Weight: `O(R + log R)` where R is the number of referenda that `target` has voted on.
     *  Weight is calculated for the maximum number of vote.
     */
    remove_vote: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *Remove a vote for a referendum.
     *
     *If the `target` is equal to the signer, then this function is exactly equivalent to
     *`remove_vote`. If not equal to the signer, then the vote must have expired,
     *either because the referendum was cancelled, because the voter lost the referendum or
     *because the conviction period is over.
     *
     *The dispatch origin of this call must be _Signed_.
     *
     *- `target`: The account of the vote to be removed; this account must have voted for
     *  referendum `index`.
     *- `index`: The index of referendum of the vote to be removed.
     *
     *Weight: `O(R + log R)` where R is the number of referenda that `target` has voted on.
     *  Weight is calculated for the maximum number of vote.
     */
    remove_other_vote: TxDescriptor<Anonymize<I7ji3jng252el9>>;
    /**
     *Permanently place a proposal into the blacklist. This prevents it from ever being
     *proposed again.
     *
     *If called on a queued public or external proposal, then this will result in it being
     *removed. If the `ref_index` supplied is an active referendum with the proposal hash,
     *then it will be cancelled.
     *
     *The dispatch origin of this call must be `BlacklistOrigin`.
     *
     *- `proposal_hash`: The proposal hash to blacklist permanently.
     *- `ref_index`: An ongoing referendum whose hash is `proposal_hash`, which will be
     *cancelled.
     *
     *Weight: `O(p)` (though as this is an high-privilege dispatch, we assume it has a
     *  reasonable value).
     */
    blacklist: TxDescriptor<Anonymize<I3v9h9f3mpm1l8>>;
    /**
     *Remove a proposal.
     *
     *The dispatch origin of this call must be `CancelProposalOrigin`.
     *
     *- `prop_index`: The index of the proposal to cancel.
     *
     *Weight: `O(p)` where `p = PublicProps::<T>::decode_len()`
     */
    cancel_proposal: TxDescriptor<Anonymize<I9mnj4k4u8ls2c>>;
    /**
     *Set or clear a metadata of a proposal or a referendum.
     *
     *Parameters:
     *- `origin`: Must correspond to the `MetadataOwner`.
     *    - `ExternalOrigin` for an external proposal with the `SuperMajorityApprove`
     *      threshold.
     *    - `ExternalDefaultOrigin` for an external proposal with the `SuperMajorityAgainst`
     *      threshold.
     *    - `ExternalMajorityOrigin` for an external proposal with the `SimpleMajority`
     *      threshold.
     *    - `Signed` by a creator for a public proposal.
     *    - `Signed` to clear a metadata for a finished referendum.
     *    - `Root` to set a metadata for an ongoing referendum.
     *- `owner`: an identifier of a metadata owner.
     *- `maybe_hash`: The hash of an on-chain stored preimage. `None` to clear a metadata.
     */
    set_metadata: TxDescriptor<Anonymize<I2kt2u1flctk2q>>;
    /**
     *Allow to force remove a vote for a referendum.
     *
     *Same as `remove_other_vote`, except the scope is overriden by forced flag.
     *The dispatch origin of this call must be `VoteRemovalOrigin`.
     *
     *Only allowed if the referendum is finished.
     *
     *The dispatch origin of this call must be _Signed_.
     *
     *- `target`: The account of the vote to be removed; this account must have voted for
     *  referendum `index`.
     *- `index`: The index of referendum of the vote to be removed.
     *
     *Weight: `O(R + log R)` where R is the number of referenda that `target` has voted on.
     *  Weight is calculated for the maximum number of vote.
     */
    force_remove_vote: TxDescriptor<Anonymize<I7ji3jng252el9>>;
  };
  Elections: {
    /**
     *Vote for a set of candidates for the upcoming round of election. This can be called to
     *set the initial votes, or update already existing votes.
     *
     *Upon initial voting, `value` units of `who`'s balance is locked and a deposit amount is
     *reserved. The deposit is based on the number of votes and can be updated over time.
     *
     *The `votes` should:
     *  - not be empty.
     *  - be less than the number of possible candidates. Note that all current members and
     *    runners-up are also automatically candidates for the next round.
     *
     *If `value` is more than `who`'s free balance, then the maximum of the two is used.
     *
     *The dispatch origin of this call must be signed.
     *
     *### Warning
     *
     *It is the responsibility of the caller to **NOT** place all of their balance into the
     *lock and keep some for further operations.
     */
    vote: TxDescriptor<Anonymize<Iaa13icjlsj13d>>;
    /**
     *Remove `origin` as a voter.
     *
     *This removes the lock and returns the deposit.
     *
     *The dispatch origin of this call must be signed and be a voter.
     */
    remove_voter: TxDescriptor<undefined>;
    /**
     *Submit oneself for candidacy. A fixed amount of deposit is recorded.
     *
     *All candidates are wiped at the end of the term. They either become a member/runner-up,
     *or leave the system while their deposit is slashed.
     *
     *The dispatch origin of this call must be signed.
     *
     *### Warning
     *
     *Even if a candidate ends up being a member, they must call [`Call::renounce_candidacy`]
     *to get their deposit back. Losing the spot in an election will always lead to a slash.
     *
     *The number of current candidates must be provided as witness data.
     *## Complexity
     *O(C + log(C)) where C is candidate_count.
     */
    submit_candidacy: TxDescriptor<Anonymize<I98vh5ccjtf1ev>>;
    /**
     *Renounce one's intention to be a candidate for the next election round. 3 potential
     *outcomes exist:
     *
     *- `origin` is a candidate and not elected in any set. In this case, the deposit is
     *  unreserved, returned and origin is removed as a candidate.
     *- `origin` is a current runner-up. In this case, the deposit is unreserved, returned and
     *  origin is removed as a runner-up.
     *- `origin` is a current member. In this case, the deposit is unreserved and origin is
     *  removed as a member, consequently not being a candidate for the next round anymore.
     *  Similar to [`remove_member`](Self::remove_member), if replacement runners exists, they
     *  are immediately used. If the prime is renouncing, then no prime will exist until the
     *  next round.
     *
     *The dispatch origin of this call must be signed, and have one of the above roles.
     *The type of renouncing must be provided as witness data.
     *
     *## Complexity
     *  - Renouncing::Candidate(count): O(count + log(count))
     *  - Renouncing::Member: O(1)
     *  - Renouncing::RunnerUp: O(1)
     */
    renounce_candidacy: TxDescriptor<Anonymize<I3al0eab2u0gt2>>;
    /**
     *Remove a particular member from the set. This is effective immediately and the bond of
     *the outgoing member is slashed.
     *
     *If a runner-up is available, then the best runner-up will be removed and replaces the
     *outgoing member. Otherwise, if `rerun_election` is `true`, a new phragmen election is
     *started, else, nothing happens.
     *
     *If `slash_bond` is set to true, the bond of the member being removed is slashed. Else,
     *it is returned.
     *
     *The dispatch origin of this call must be root.
     *
     *Note that this does not affect the designated block number of the next election.
     *
     *## Complexity
     *- Check details of remove_and_replace_member() and do_phragmen().
     */
    remove_member: TxDescriptor<Anonymize<I7hhej9ji2h5gt>>;
    /**
     *Clean all voters who are defunct (i.e. they do not serve any purpose at all). The
     *deposit of the removed voters are returned.
     *
     *This is an root function to be used only for cleaning the state.
     *
     *The dispatch origin of this call must be root.
     *
     *## Complexity
     *- Check is_defunct_voter() details.
     */
    clean_defunct_voters: TxDescriptor<Anonymize<I6fuug4i4r04hi>>;
  };
  Council: {
    /**
     *Set the collective's membership.
     *
     *- `new_members`: The new member list. Be nice to the chain and provide it sorted.
     *- `prime`: The prime member whose vote sets the default.
     *- `old_count`: The upper bound for the previous number of members in storage. Used for
     *  weight estimation.
     *
     *The dispatch of this call must be `SetMembersOrigin`.
     *
     *NOTE: Does not enforce the expected `MaxMembers` limit on the amount of members, but
     *      the weight estimations rely on it to estimate dispatchable weight.
     *
     *# WARNING:
     *
     *The `pallet-collective` can also be managed by logic outside of the pallet through the
     *implementation of the trait [`ChangeMembers`].
     *Any call to `set_members` must be careful that the member set doesn't get out of sync
     *with other logic managing the member set.
     *
     *## Complexity:
     *- `O(MP + N)` where:
     *  - `M` old-members-count (code- and governance-bounded)
     *  - `N` new-members-count (code- and governance-bounded)
     *  - `P` proposals-count (code-bounded)
     */
    set_members: TxDescriptor<Anonymize<I38jfk5li8iang>>;
    /**
     *Dispatch a proposal from a member using the `Member` origin.
     *
     *Origin must be a member of the collective.
     *
     *## Complexity:
     *- `O(B + M + P)` where:
     *- `B` is `proposal` size in bytes (length-fee-bounded)
     *- `M` members-count (code-bounded)
     *- `P` complexity of dispatching `proposal`
     */
    execute: TxDescriptor<Anonymize<If6o6gqb6cajtb>>;
    /**
     *Add a new proposal to either be voted on or executed directly.
     *
     *Requires the sender to be member.
     *
     *`threshold` determines whether `proposal` is executed directly (`threshold < 2`)
     *or put up for voting.
     *
     *## Complexity
     *- `O(B + M + P1)` or `O(B + M + P2)` where:
     *  - `B` is `proposal` size in bytes (length-fee-bounded)
     *  - `M` is members-count (code- and governance-bounded)
     *  - branching is influenced by `threshold` where:
     *    - `P1` is proposal execution complexity (`threshold < 2`)
     *    - `P2` is proposals-count (code-bounded) (`threshold >= 2`)
     */
    propose: TxDescriptor<Anonymize<Iehb3squnhooig>>;
    /**
     *Add an aye or nay vote for the sender to the given proposal.
     *
     *Requires the sender to be a member.
     *
     *Transaction fees will be waived if the member is voting on any particular proposal
     *for the first time and the call is successful. Subsequent vote changes will charge a
     *fee.
     *## Complexity
     *- `O(M)` where `M` is members-count (code- and governance-bounded)
     */
    vote: TxDescriptor<Anonymize<I2dtrijkm5601t>>;
    /**
     *Disapprove a proposal, close, and remove it from the system, regardless of its current
     *state.
     *
     *Must be called by the Root origin.
     *
     *Parameters:
     ** `proposal_hash`: The hash of the proposal that should be disapproved.
     *
     *## Complexity
     *O(P) where P is the number of max proposals
     */
    disapprove_proposal: TxDescriptor<Anonymize<I2ev73t79f46tb>>;
    /**
     *Close a vote that is either approved, disapproved or whose voting period has ended.
     *
     *May be called by any signed account in order to finish voting and close the proposal.
     *
     *If called before the end of the voting period it will only close the vote if it is
     *has enough votes to be approved or disapproved.
     *
     *If called after the end of the voting period abstentions are counted as rejections
     *unless there is a prime member set and the prime member cast an approval.
     *
     *If the close operation completes successfully with disapproval, the transaction fee will
     *be waived. Otherwise execution of the approved operation will be charged to the caller.
     *
     *+ `proposal_weight_bound`: The maximum amount of weight consumed by executing the closed
     *proposal.
     *+ `length_bound`: The upper bound for the length of the proposal in storage. Checked via
     *`storage::read` so it is `size_of::<u32>() == 4` larger than the pure length.
     *
     *## Complexity
     *- `O(B + M + P1 + P2)` where:
     *  - `B` is `proposal` size in bytes (length-fee-bounded)
     *  - `M` is members-count (code- and governance-bounded)
     *  - `P1` is the complexity of `proposal` preimage.
     *  - `P2` is proposal-count (code-bounded)
     */
    close: TxDescriptor<Anonymize<Ib2obgji960euh>>;
  };
  TechnicalCommittee: {
    /**
     *Set the collective's membership.
     *
     *- `new_members`: The new member list. Be nice to the chain and provide it sorted.
     *- `prime`: The prime member whose vote sets the default.
     *- `old_count`: The upper bound for the previous number of members in storage. Used for
     *  weight estimation.
     *
     *The dispatch of this call must be `SetMembersOrigin`.
     *
     *NOTE: Does not enforce the expected `MaxMembers` limit on the amount of members, but
     *      the weight estimations rely on it to estimate dispatchable weight.
     *
     *# WARNING:
     *
     *The `pallet-collective` can also be managed by logic outside of the pallet through the
     *implementation of the trait [`ChangeMembers`].
     *Any call to `set_members` must be careful that the member set doesn't get out of sync
     *with other logic managing the member set.
     *
     *## Complexity:
     *- `O(MP + N)` where:
     *  - `M` old-members-count (code- and governance-bounded)
     *  - `N` new-members-count (code- and governance-bounded)
     *  - `P` proposals-count (code-bounded)
     */
    set_members: TxDescriptor<Anonymize<I38jfk5li8iang>>;
    /**
     *Dispatch a proposal from a member using the `Member` origin.
     *
     *Origin must be a member of the collective.
     *
     *## Complexity:
     *- `O(B + M + P)` where:
     *- `B` is `proposal` size in bytes (length-fee-bounded)
     *- `M` members-count (code-bounded)
     *- `P` complexity of dispatching `proposal`
     */
    execute: TxDescriptor<Anonymize<If6o6gqb6cajtb>>;
    /**
     *Add a new proposal to either be voted on or executed directly.
     *
     *Requires the sender to be member.
     *
     *`threshold` determines whether `proposal` is executed directly (`threshold < 2`)
     *or put up for voting.
     *
     *## Complexity
     *- `O(B + M + P1)` or `O(B + M + P2)` where:
     *  - `B` is `proposal` size in bytes (length-fee-bounded)
     *  - `M` is members-count (code- and governance-bounded)
     *  - branching is influenced by `threshold` where:
     *    - `P1` is proposal execution complexity (`threshold < 2`)
     *    - `P2` is proposals-count (code-bounded) (`threshold >= 2`)
     */
    propose: TxDescriptor<Anonymize<Iehb3squnhooig>>;
    /**
     *Add an aye or nay vote for the sender to the given proposal.
     *
     *Requires the sender to be a member.
     *
     *Transaction fees will be waived if the member is voting on any particular proposal
     *for the first time and the call is successful. Subsequent vote changes will charge a
     *fee.
     *## Complexity
     *- `O(M)` where `M` is members-count (code- and governance-bounded)
     */
    vote: TxDescriptor<Anonymize<I2dtrijkm5601t>>;
    /**
     *Disapprove a proposal, close, and remove it from the system, regardless of its current
     *state.
     *
     *Must be called by the Root origin.
     *
     *Parameters:
     ** `proposal_hash`: The hash of the proposal that should be disapproved.
     *
     *## Complexity
     *O(P) where P is the number of max proposals
     */
    disapprove_proposal: TxDescriptor<Anonymize<I2ev73t79f46tb>>;
    /**
     *Close a vote that is either approved, disapproved or whose voting period has ended.
     *
     *May be called by any signed account in order to finish voting and close the proposal.
     *
     *If called before the end of the voting period it will only close the vote if it is
     *has enough votes to be approved or disapproved.
     *
     *If called after the end of the voting period abstentions are counted as rejections
     *unless there is a prime member set and the prime member cast an approval.
     *
     *If the close operation completes successfully with disapproval, the transaction fee will
     *be waived. Otherwise execution of the approved operation will be charged to the caller.
     *
     *+ `proposal_weight_bound`: The maximum amount of weight consumed by executing the closed
     *proposal.
     *+ `length_bound`: The upper bound for the length of the proposal in storage. Checked via
     *`storage::read` so it is `size_of::<u32>() == 4` larger than the pure length.
     *
     *## Complexity
     *- `O(B + M + P1 + P2)` where:
     *  - `B` is `proposal` size in bytes (length-fee-bounded)
     *  - `M` is members-count (code- and governance-bounded)
     *  - `P1` is the complexity of `proposal` preimage.
     *  - `P2` is proposal-count (code-bounded)
     */
    close: TxDescriptor<Anonymize<Ib2obgji960euh>>;
  };
  Tips: {
    /**
     *Report something `reason` that deserves a tip and claim any eventual the finder's fee.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *Payment: `TipReportDepositBase` will be reserved from the origin account, as well as
     *`DataDepositPerByte` for each byte in `reason`.
     *
     *- `reason`: The reason for, or the thing that deserves, the tip; generally this will be
     *  a UTF-8-encoded URL.
     *- `who`: The account which should be credited for the tip.
     *
     *Emits `NewTip` if successful.
     *
     *## Complexity
     *- `O(R)` where `R` length of `reason`.
     *  - encoding and hashing of 'reason'
     */
    report_awesome: TxDescriptor<Anonymize<Ie6dn4p5chsk1u>>;
    /**
     *Retract a prior tip-report from `report_awesome`, and cancel the process of tipping.
     *
     *If successful, the original deposit will be unreserved.
     *
     *The dispatch origin for this call must be _Signed_ and the tip identified by `hash`
     *must have been reported by the signing account through `report_awesome` (and not
     *through `tip_new`).
     *
     *- `hash`: The identity of the open tip for which a tip value is declared. This is formed
     *  as the hash of the tuple of the original tip `reason` and the beneficiary account ID.
     *
     *Emits `TipRetracted` if successful.
     *
     *## Complexity
     *- `O(1)`
     *  - Depends on the length of `T::Hash` which is fixed.
     */
    retract_tip: TxDescriptor<Anonymize<I1jm8m1rh9e20v>>;
    /**
     *Give a tip for something new; no finder's fee will be taken.
     *
     *The dispatch origin for this call must be _Signed_ and the signing account must be a
     *member of the `Tippers` set.
     *
     *- `reason`: The reason for, or the thing that deserves, the tip; generally this will be
     *  a UTF-8-encoded URL.
     *- `who`: The account which should be credited for the tip.
     *- `tip_value`: The amount of tip that the sender would like to give. The median tip
     *  value of active tippers will be given to the `who`.
     *
     *Emits `NewTip` if successful.
     *
     *## Complexity
     *- `O(R + T)` where `R` length of `reason`, `T` is the number of tippers.
     *  - `O(T)`: decoding `Tipper` vec of length `T`. `T` is charged as upper bound given by
     *    `ContainsLengthBound`. The actual cost depends on the implementation of
     *    `T::Tippers`.
     *  - `O(R)`: hashing and encoding of reason of length `R`
     */
    tip_new: TxDescriptor<Anonymize<I2vi5dr4528rgv>>;
    /**
     *Declare a tip value for an already-open tip.
     *
     *The dispatch origin for this call must be _Signed_ and the signing account must be a
     *member of the `Tippers` set.
     *
     *- `hash`: The identity of the open tip for which a tip value is declared. This is formed
     *  as the hash of the tuple of the hash of the original tip `reason` and the beneficiary
     *  account ID.
     *- `tip_value`: The amount of tip that the sender would like to give. The median tip
     *  value of active tippers will be given to the `who`.
     *
     *Emits `TipClosing` if the threshold of tippers has been reached and the countdown period
     *has started.
     *
     *## Complexity
     *- `O(T)` where `T` is the number of tippers. decoding `Tipper` vec of length `T`, insert
     *  tip and check closing, `T` is charged as upper bound given by `ContainsLengthBound`.
     *  The actual cost depends on the implementation of `T::Tippers`.
     *
     *  Actually weight could be lower as it depends on how many tips are in `OpenTip` but it
     *  is weighted as if almost full i.e of length `T-1`.
     */
    tip: TxDescriptor<Anonymize<I1pm30k3i4438u>>;
    /**
     *Close and payout a tip.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *The tip identified by `hash` must have finished its countdown period.
     *
     *- `hash`: The identity of the open tip for which a tip value is declared. This is formed
     *  as the hash of the tuple of the original tip `reason` and the beneficiary account ID.
     *
     *## Complexity
     *- : `O(T)` where `T` is the number of tippers. decoding `Tipper` vec of length `T`. `T`
     *  is charged as upper bound given by `ContainsLengthBound`. The actual cost depends on
     *  the implementation of `T::Tippers`.
     */
    close_tip: TxDescriptor<Anonymize<I1jm8m1rh9e20v>>;
    /**
     *Remove and slash an already-open tip.
     *
     *May only be called from `T::RejectOrigin`.
     *
     *As a result, the finder is slashed and the deposits are lost.
     *
     *Emits `TipSlashed` if successful.
     *
     *## Complexity
     *- O(1).
     */
    slash_tip: TxDescriptor<Anonymize<I1jm8m1rh9e20v>>;
  };
  Proxy: {
    /**
     *Dispatch the given `call` from an account that the sender is authorised for through
     *`add_proxy`.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *Parameters:
     *- `real`: The account that the proxy will make a call on behalf of.
     *- `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
     *- `call`: The call to be made by the `real` account.
     */
    proxy: TxDescriptor<Anonymize<Igd9530gfdrn3>>;
    /**
     *Register a proxy account for the sender that is able to make calls on its behalf.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *Parameters:
     *- `proxy`: The account that the `caller` would like to make a proxy.
     *- `proxy_type`: The permissions allowed for this proxy account.
     *- `delay`: The announcement period required of the initial proxy. Will generally be
     *zero.
     */
    add_proxy: TxDescriptor<Anonymize<I2e1ekg17a2uj2>>;
    /**
     *Unregister a proxy account for the sender.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *Parameters:
     *- `proxy`: The account that the `caller` would like to remove as a proxy.
     *- `proxy_type`: The permissions currently enabled for the removed proxy account.
     */
    remove_proxy: TxDescriptor<Anonymize<I2e1ekg17a2uj2>>;
    /**
     *Unregister all proxy accounts for the sender.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *WARNING: This may be called on accounts created by `pure`, however if done, then
     *the unreserved fees will be inaccessible. **All access to this account will be lost.**
     */
    remove_proxies: TxDescriptor<undefined>;
    /**
     *Spawn a fresh new account that is guaranteed to be otherwise inaccessible, and
     *initialize it with a proxy of `proxy_type` for `origin` sender.
     *
     *Requires a `Signed` origin.
     *
     *- `proxy_type`: The type of the proxy that the sender will be registered as over the
     *new account. This will almost always be the most permissive `ProxyType` possible to
     *allow for maximum flexibility.
     *- `index`: A disambiguation index, in case this is called multiple times in the same
     *transaction (e.g. with `utility::batch`). Unless you're using `batch` you probably just
     *want to use `0`.
     *- `delay`: The announcement period required of the initial proxy. Will generally be
     *zero.
     *
     *Fails with `Duplicate` if this has already been called in this transaction, from the
     *same sender, with the same parameters.
     *
     *Fails if there are insufficient funds to pay for deposit.
     */
    create_pure: TxDescriptor<Anonymize<I9uff8o8g5b5av>>;
    /**
     *Removes a previously spawned pure proxy.
     *
     *WARNING: **All access to this account will be lost.** Any funds held in it will be
     *inaccessible.
     *
     *Requires a `Signed` origin, and the sender account must have been created by a call to
     *`pure` with corresponding parameters.
     *
     *- `spawner`: The account that originally called `pure` to create this account.
     *- `index`: The disambiguation index originally passed to `pure`. Probably `0`.
     *- `proxy_type`: The proxy type originally passed to `pure`.
     *- `height`: The height of the chain when the call to `pure` was processed.
     *- `ext_index`: The extrinsic index in which the call to `pure` was processed.
     *
     *Fails with `NoPermission` in case the caller is not a previously created pure
     *account whose `pure` call has corresponding parameters.
     */
    kill_pure: TxDescriptor<Anonymize<I1acluqiqlacck>>;
    /**
     *Publish the hash of a proxy-call that will be made in the future.
     *
     *This must be called some number of blocks before the corresponding `proxy` is attempted
     *if the delay associated with the proxy relationship is greater than zero.
     *
     *No more than `MaxPending` announcements may be made at any one time.
     *
     *This will take a deposit of `AnnouncementDepositFactor` as well as
     *`AnnouncementDepositBase` if there are no other pending announcements.
     *
     *The dispatch origin for this call must be _Signed_ and a proxy of `real`.
     *
     *Parameters:
     *- `real`: The account that the proxy will make a call on behalf of.
     *- `call_hash`: The hash of the call to be made by the `real` account.
     */
    announce: TxDescriptor<Anonymize<Idkqesere66fs7>>;
    /**
     *Remove a given announcement.
     *
     *May be called by a proxy account to remove a call they previously announced and return
     *the deposit.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *Parameters:
     *- `real`: The account that the proxy will make a call on behalf of.
     *- `call_hash`: The hash of the call to be made by the `real` account.
     */
    remove_announcement: TxDescriptor<Anonymize<Idkqesere66fs7>>;
    /**
     *Remove the given announcement of a delegate.
     *
     *May be called by a target (proxied) account to remove a call that one of their delegates
     *(`delegate`) has announced they want to execute. The deposit is returned.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *Parameters:
     *- `delegate`: The account that previously announced the call.
     *- `call_hash`: The hash of the call to be made.
     */
    reject_announcement: TxDescriptor<Anonymize<Ifs54vj2idl9k4>>;
    /**
     *Dispatch the given `call` from an account that the sender is authorized for through
     *`add_proxy`.
     *
     *Removes any corresponding announcement(s).
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *Parameters:
     *- `real`: The account that the proxy will make a call on behalf of.
     *- `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
     *- `call`: The call to be made by the `real` account.
     */
    proxy_announced: TxDescriptor<Anonymize<Id0r8q2e0it0cs>>;
  };
  Multisig: {
    /**
     *Immediately dispatch a multi-signature call using a single approval from the caller.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *- `other_signatories`: The accounts (other than the sender) who are part of the
     *multi-signature, but do not participate in the approval process.
     *- `call`: The call to be executed.
     *
     *Result is equivalent to the dispatched result.
     *
     *## Complexity
     *O(Z + C) where Z is the length of the call and C its execution weight.
     */
    as_multi_threshold_1: TxDescriptor<Anonymize<I8545phbh5off1>>;
    /**
     *Register approval for a dispatch to be made from a deterministic composite account if
     *approved by a total of `threshold - 1` of `other_signatories`.
     *
     *If there are enough, then dispatch the call.
     *
     *Payment: `DepositBase` will be reserved if this is the first approval, plus
     *`threshold` times `DepositFactor`. It is returned once this dispatch happens or
     *is cancelled.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *- `threshold`: The total number of approvals for this dispatch before it is executed.
     *- `other_signatories`: The accounts (other than the sender) who can approve this
     *dispatch. May not be empty.
     *- `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
     *not the first approval, then it must be `Some`, with the timepoint (block number and
     *transaction index) of the first approval transaction.
     *- `call`: The call to be executed.
     *
     *NOTE: Unless this is the final approval, you will generally want to use
     *`approve_as_multi` instead, since it only requires a hash of the call.
     *
     *Result is equivalent to the dispatched result if `threshold` is exactly `1`. Otherwise
     *on success, result is `Ok` and the result from the interior call, if it was executed,
     *may be found in the deposited `MultisigExecuted` event.
     *
     *## Complexity
     *- `O(S + Z + Call)`.
     *- Up to one balance-reserve or unreserve operation.
     *- One passthrough operation, one insert, both `O(S)` where `S` is the number of
     *  signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
     *- One call encode & hash, both of complexity `O(Z)` where `Z` is tx-len.
     *- One encode & hash, both of complexity `O(S)`.
     *- Up to one binary search and insert (`O(logS + S)`).
     *- I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
     *- One event.
     *- The weight of the `call`.
     *- Storage: inserts one item, value size bounded by `MaxSignatories`, with a deposit
     *  taken for its lifetime of `DepositBase + threshold * DepositFactor`.
     */
    as_multi: TxDescriptor<Anonymize<I5dr8mcko4nff>>;
    /**
     *Register approval for a dispatch to be made from a deterministic composite account if
     *approved by a total of `threshold - 1` of `other_signatories`.
     *
     *Payment: `DepositBase` will be reserved if this is the first approval, plus
     *`threshold` times `DepositFactor`. It is returned once this dispatch happens or
     *is cancelled.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *- `threshold`: The total number of approvals for this dispatch before it is executed.
     *- `other_signatories`: The accounts (other than the sender) who can approve this
     *dispatch. May not be empty.
     *- `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
     *not the first approval, then it must be `Some`, with the timepoint (block number and
     *transaction index) of the first approval transaction.
     *- `call_hash`: The hash of the call to be executed.
     *
     *NOTE: If this is the final approval, you will want to use `as_multi` instead.
     *
     *## Complexity
     *- `O(S)`.
     *- Up to one balance-reserve or unreserve operation.
     *- One passthrough operation, one insert, both `O(S)` where `S` is the number of
     *  signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
     *- One encode & hash, both of complexity `O(S)`.
     *- Up to one binary search and insert (`O(logS + S)`).
     *- I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
     *- One event.
     *- Storage: inserts one item, value size bounded by `MaxSignatories`, with a deposit
     *  taken for its lifetime of `DepositBase + threshold * DepositFactor`.
     */
    approve_as_multi: TxDescriptor<Anonymize<Ideaemvoneh309>>;
    /**
     *Cancel a pre-existing, on-going multisig transaction. Any deposit reserved previously
     *for this operation will be unreserved on success.
     *
     *The dispatch origin for this call must be _Signed_.
     *
     *- `threshold`: The total number of approvals for this dispatch before it is executed.
     *- `other_signatories`: The accounts (other than the sender) who can approve this
     *dispatch. May not be empty.
     *- `timepoint`: The timepoint (block number and transaction index) of the first approval
     *transaction for this dispatch.
     *- `call_hash`: The hash of the call to be executed.
     *
     *## Complexity
     *- `O(S)`.
     *- Up to one balance-reserve or unreserve operation.
     *- One passthrough operation, one insert, both `O(S)` where `S` is the number of
     *  signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
     *- One encode & hash, both of complexity `O(S)`.
     *- One event.
     *- I/O: 1 read `O(S)`, one remove.
     *- Storage: removes one item.
     */
    cancel_as_multi: TxDescriptor<Anonymize<I3d9o9d7epp66v>>;
  };
  Uniques: {
    /**
     *Issue a new collection of non-fungible items from a public origin.
     *
     *This new collection has no items initially and its owner is the origin.
     *
     *The origin must conform to the configured `CreateOrigin` and have sufficient funds free.
     *
     *`ItemDeposit` funds of sender are reserved.
     *
     *Parameters:
     *- `collection`: The identifier of the new collection. This must not be currently in use.
     *- `admin`: The admin of this collection. The admin is the initial address of each
     *member of the collection's admin team.
     *
     *Emits `Created` event when successful.
     *
     *Weight: `O(1)`
     */
    create: TxDescriptor<Anonymize<I3rrsthr03bsf8>>;
    /**
     *Issue a new collection of non-fungible items from a privileged origin.
     *
     *This new collection has no items initially.
     *
     *The origin must conform to `ForceOrigin`.
     *
     *Unlike `create`, no funds are reserved.
     *
     *- `collection`: The identifier of the new item. This must not be currently in use.
     *- `owner`: The owner of this collection of items. The owner has full superuser
     *  permissions
     *over this item, but may later change and configure the permissions using
     *`transfer_ownership` and `set_team`.
     *
     *Emits `ForceCreated` event when successful.
     *
     *Weight: `O(1)`
     */
    force_create: TxDescriptor<Anonymize<I1it6nfuocs3uo>>;
    /**
     *Destroy a collection of fungible items.
     *
     *The origin must conform to `ForceOrigin` or must be `Signed` and the sender must be the
     *owner of the `collection`.
     *
     *- `collection`: The identifier of the collection to be destroyed.
     *- `witness`: Information on the items minted in the collection. This must be
     *correct.
     *
     *Emits `Destroyed` event when successful.
     *
     *Weight: `O(n + m)` where:
     *- `n = witness.items`
     *- `m = witness.item_metadatas`
     *- `a = witness.attributes`
     */
    destroy: TxDescriptor<Anonymize<I83qeclck631s2>>;
    /**
     *Mint an item of a particular collection.
     *
     *The origin must be Signed and the sender must be the Issuer of the `collection`.
     *
     *- `collection`: The collection of the item to be minted.
     *- `item`: The item value of the item to be minted.
     *- `beneficiary`: The initial owner of the minted item.
     *
     *Emits `Issued` event when successful.
     *
     *Weight: `O(1)`
     */
    mint: TxDescriptor<Anonymize<I846j8gk91gp4q>>;
    /**
     *Destroy a single item.
     *
     *Origin must be Signed and the signing account must be either:
     *- the Admin of the `collection`;
     *- the Owner of the `item`;
     *
     *- `collection`: The collection of the item to be burned.
     *- `item`: The item of the item to be burned.
     *- `check_owner`: If `Some` then the operation will fail with `WrongOwner` unless the
     *  item is owned by this value.
     *
     *Emits `Burned` with the actual amount burned.
     *
     *Weight: `O(1)`
     *Modes: `check_owner.is_some()`.
     */
    burn: TxDescriptor<Anonymize<I4apbr3d7b110l>>;
    /**
     *Move an item from the sender account to another.
     *
     *This resets the approved account of the item.
     *
     *Origin must be Signed and the signing account must be either:
     *- the Admin of the `collection`;
     *- the Owner of the `item`;
     *- the approved delegate for the `item` (in this case, the approval is reset).
     *
     *Arguments:
     *- `collection`: The collection of the item to be transferred.
     *- `item`: The item of the item to be transferred.
     *- `dest`: The account to receive ownership of the item.
     *
     *Emits `Transferred`.
     *
     *Weight: `O(1)`
     */
    transfer: TxDescriptor<Anonymize<I9svbf1ionsuba>>;
    /**
     *Reevaluate the deposits on some items.
     *
     *Origin must be Signed and the sender should be the Owner of the `collection`.
     *
     *- `collection`: The collection to be frozen.
     *- `items`: The items of the collection whose deposits will be reevaluated.
     *
     *NOTE: This exists as a best-effort function. Any items which are unknown or
     *in the case that the owner account does not have reservable funds to pay for a
     *deposit increase are ignored. Generally the owner isn't going to call this on items
     *whose existing deposit is less than the refreshed deposit as it would only cost them,
     *so it's of little consequence.
     *
     *It will still return an error in the case that the collection is unknown of the signer
     *is not permitted to call it.
     *
     *Weight: `O(items.len())`
     */
    redeposit: TxDescriptor<Anonymize<I63enm20toa64c>>;
    /**
     *Disallow further unprivileged transfer of an item.
     *
     *Origin must be Signed and the sender should be the Freezer of the `collection`.
     *
     *- `collection`: The collection of the item to be frozen.
     *- `item`: The item of the item to be frozen.
     *
     *Emits `Frozen`.
     *
     *Weight: `O(1)`
     */
    freeze: TxDescriptor<Anonymize<I92ucef7ff2o7l>>;
    /**
     *Re-allow unprivileged transfer of an item.
     *
     *Origin must be Signed and the sender should be the Freezer of the `collection`.
     *
     *- `collection`: The collection of the item to be thawed.
     *- `item`: The item of the item to be thawed.
     *
     *Emits `Thawed`.
     *
     *Weight: `O(1)`
     */
    thaw: TxDescriptor<Anonymize<I92ucef7ff2o7l>>;
    /**
     *Disallow further unprivileged transfers for a whole collection.
     *
     *Origin must be Signed and the sender should be the Freezer of the `collection`.
     *
     *- `collection`: The collection to be frozen.
     *
     *Emits `CollectionFrozen`.
     *
     *Weight: `O(1)`
     */
    freeze_collection: TxDescriptor<Anonymize<I88sl1jplq27bh>>;
    /**
     *Re-allow unprivileged transfers for a whole collection.
     *
     *Origin must be Signed and the sender should be the Admin of the `collection`.
     *
     *- `collection`: The collection to be thawed.
     *
     *Emits `CollectionThawed`.
     *
     *Weight: `O(1)`
     */
    thaw_collection: TxDescriptor<Anonymize<I88sl1jplq27bh>>;
    /**
     *Change the Owner of a collection.
     *
     *Origin must be Signed and the sender should be the Owner of the `collection`.
     *
     *- `collection`: The collection whose owner should be changed.
     *- `owner`: The new Owner of this collection. They must have called
     *  `set_accept_ownership` with `collection` in order for this operation to succeed.
     *
     *Emits `OwnerChanged`.
     *
     *Weight: `O(1)`
     */
    transfer_ownership: TxDescriptor<Anonymize<I2970lus2v0qct>>;
    /**
     *Change the Issuer, Admin and Freezer of a collection.
     *
     *Origin must be Signed and the sender should be the Owner of the `collection`.
     *
     *- `collection`: The collection whose team should be changed.
     *- `issuer`: The new Issuer of this collection.
     *- `admin`: The new Admin of this collection.
     *- `freezer`: The new Freezer of this collection.
     *
     *Emits `TeamChanged`.
     *
     *Weight: `O(1)`
     */
    set_team: TxDescriptor<Anonymize<I1vsbo63n9pu69>>;
    /**
     *Approve an item to be transferred by a delegated third-party account.
     *
     *The origin must conform to `ForceOrigin` or must be `Signed` and the sender must be
     *either the owner of the `item` or the admin of the collection.
     *
     *- `collection`: The collection of the item to be approved for delegated transfer.
     *- `item`: The item of the item to be approved for delegated transfer.
     *- `delegate`: The account to delegate permission to transfer the item.
     *
     *Important NOTE: The `approved` account gets reset after each transfer.
     *
     *Emits `ApprovedTransfer` on success.
     *
     *Weight: `O(1)`
     */
    approve_transfer: TxDescriptor<Anonymize<I3fatc2oi4mp63>>;
    /**
     *Cancel the prior approval for the transfer of an item by a delegate.
     *
     *Origin must be either:
     *- the `Force` origin;
     *- `Signed` with the signer being the Admin of the `collection`;
     *- `Signed` with the signer being the Owner of the `item`;
     *
     *Arguments:
     *- `collection`: The collection of the item of whose approval will be cancelled.
     *- `item`: The item of the item of whose approval will be cancelled.
     *- `maybe_check_delegate`: If `Some` will ensure that the given account is the one to
     *  which permission of transfer is delegated.
     *
     *Emits `ApprovalCancelled` on success.
     *
     *Weight: `O(1)`
     */
    cancel_approval: TxDescriptor<Anonymize<I1j3v9uknthnij>>;
    /**
     *Alter the attributes of a given item.
     *
     *Origin must be `ForceOrigin`.
     *
     *- `collection`: The identifier of the item.
     *- `owner`: The new Owner of this item.
     *- `issuer`: The new Issuer of this item.
     *- `admin`: The new Admin of this item.
     *- `freezer`: The new Freezer of this item.
     *- `free_holding`: Whether a deposit is taken for holding an item of this collection.
     *- `is_frozen`: Whether this collection is frozen except for permissioned/admin
     *instructions.
     *
     *Emits `ItemStatusChanged` with the identity of the item.
     *
     *Weight: `O(1)`
     */
    force_item_status: TxDescriptor<Anonymize<I6ng2cdk1vvip6>>;
    /**
     *Set an attribute for a collection or item.
     *
     *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
     *`collection`.
     *
     *If the origin is Signed, then funds of signer are reserved according to the formula:
     *`MetadataDepositBase + DepositPerByte * (key.len + value.len)` taking into
     *account any already reserved funds.
     *
     *- `collection`: The identifier of the collection whose item's metadata to set.
     *- `maybe_item`: The identifier of the item whose metadata to set.
     *- `key`: The key of the attribute.
     *- `value`: The value to which to set the attribute.
     *
     *Emits `AttributeSet`.
     *
     *Weight: `O(1)`
     */
    set_attribute: TxDescriptor<Anonymize<I62ht2i39rtkaa>>;
    /**
     *Clear an attribute for a collection or item.
     *
     *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
     *`collection`.
     *
     *Any deposit is freed for the collection's owner.
     *
     *- `collection`: The identifier of the collection whose item's metadata to clear.
     *- `maybe_item`: The identifier of the item whose metadata to clear.
     *- `key`: The key of the attribute.
     *
     *Emits `AttributeCleared`.
     *
     *Weight: `O(1)`
     */
    clear_attribute: TxDescriptor<Anonymize<Ichf8eu9t3dtc2>>;
    /**
     *Set the metadata for an item.
     *
     *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
     *`collection`.
     *
     *If the origin is Signed, then funds of signer are reserved according to the formula:
     *`MetadataDepositBase + DepositPerByte * data.len` taking into
     *account any already reserved funds.
     *
     *- `collection`: The identifier of the collection whose item's metadata to set.
     *- `item`: The identifier of the item whose metadata to set.
     *- `data`: The general information of this item. Limited in length by `StringLimit`.
     *- `is_frozen`: Whether the metadata should be frozen against further changes.
     *
     *Emits `MetadataSet`.
     *
     *Weight: `O(1)`
     */
    set_metadata: TxDescriptor<Anonymize<I9e4bfe80t2int>>;
    /**
     *Clear the metadata for an item.
     *
     *Origin must be either `ForceOrigin` or Signed and the sender should be the Owner of the
     *`item`.
     *
     *Any deposit is freed for the collection's owner.
     *
     *- `collection`: The identifier of the collection whose item's metadata to clear.
     *- `item`: The identifier of the item whose metadata to clear.
     *
     *Emits `MetadataCleared`.
     *
     *Weight: `O(1)`
     */
    clear_metadata: TxDescriptor<Anonymize<I92ucef7ff2o7l>>;
    /**
     *Set the metadata for a collection.
     *
     *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Owner of
     *the `collection`.
     *
     *If the origin is `Signed`, then funds of signer are reserved according to the formula:
     *`MetadataDepositBase + DepositPerByte * data.len` taking into
     *account any already reserved funds.
     *
     *- `collection`: The identifier of the item whose metadata to update.
     *- `data`: The general information of this item. Limited in length by `StringLimit`.
     *- `is_frozen`: Whether the metadata should be frozen against further changes.
     *
     *Emits `CollectionMetadataSet`.
     *
     *Weight: `O(1)`
     */
    set_collection_metadata: TxDescriptor<Anonymize<I9oai3q0an1tbo>>;
    /**
     *Clear the metadata for a collection.
     *
     *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Owner of
     *the `collection`.
     *
     *Any deposit is freed for the collection's owner.
     *
     *- `collection`: The identifier of the collection whose metadata to clear.
     *
     *Emits `CollectionMetadataCleared`.
     *
     *Weight: `O(1)`
     */
    clear_collection_metadata: TxDescriptor<Anonymize<I88sl1jplq27bh>>;
    /**
     *Set (or reset) the acceptance of ownership for a particular account.
     *
     *Origin must be `Signed` and if `maybe_collection` is `Some`, then the signer must have a
     *provider reference.
     *
     *- `maybe_collection`: The identifier of the collection whose ownership the signer is
     *  willing to accept, or if `None`, an indication that the signer is willing to accept no
     *  ownership transferal.
     *
     *Emits `OwnershipAcceptanceChanged`.
     */
    set_accept_ownership: TxDescriptor<Anonymize<I90ivo9n6p6nqo>>;
    /**
     *Set the maximum amount of items a collection could have.
     *
     *Origin must be either `ForceOrigin` or `Signed` and the sender should be the Owner of
     *the `collection`.
     *
     *Note: This function can only succeed once per collection.
     *
     *- `collection`: The identifier of the collection to change.
     *- `max_supply`: The maximum amount of items a collection could have.
     *
     *Emits `CollectionMaxSupplySet` event when successful.
     */
    set_collection_max_supply: TxDescriptor<Anonymize<Idj9k8sn80h3m6>>;
    /**
     *Set (or reset) the price for an item.
     *
     *Origin must be Signed and must be the owner of the asset `item`.
     *
     *- `collection`: The collection of the item.
     *- `item`: The item to set the price for.
     *- `price`: The price for the item. Pass `None`, to reset the price.
     *- `buyer`: Restricts the buy operation to a specific account.
     *
     *Emits `ItemPriceSet` on success if the price is not `None`.
     *Emits `ItemPriceRemoved` on success if the price is `None`.
     */
    set_price: TxDescriptor<Anonymize<I64f3h3tf92u6f>>;
    /**
     *Allows to buy an item if it's up for sale.
     *
     *Origin must be Signed and must not be the owner of the `item`.
     *
     *- `collection`: The collection of the item.
     *- `item`: The item the sender wants to buy.
     *- `bid_price`: The price the sender is willing to pay.
     *
     *Emits `ItemBought` on success.
     */
    buy_item: TxDescriptor<Anonymize<Ifnmu9mlmgtdbf>>;
  };
  StateTrieMigration: {
    /**
     *Control the automatic migration.
     *
     *The dispatch origin of this call must be [`Config::ControlOrigin`].
     */
    control_auto_migration: TxDescriptor<Anonymize<I7psec5e6ghc64>>;
    /**
     *Continue the migration for the given `limits`.
     *
     *The dispatch origin of this call can be any signed account.
     *
     *This transaction has NO MONETARY INCENTIVES. calling it will not reward anyone. Albeit,
     *Upon successful execution, the transaction fee is returned.
     *
     *The (potentially over-estimated) of the byte length of all the data read must be
     *provided for up-front fee-payment and weighing. In essence, the caller is guaranteeing
     *that executing the current `MigrationTask` with the given `limits` will not exceed
     *`real_size_upper` bytes of read data.
     *
     *The `witness_task` is merely a helper to prevent the caller from being slashed or
     *generally trigger a migration that they do not intend. This parameter is just a message
     *from caller, saying that they believed `witness_task` was the last state of the
     *migration, and they only wish for their transaction to do anything, if this assumption
     *holds. In case `witness_task` does not match, the transaction fails.
     *
     *Based on the documentation of [`MigrationTask::migrate_until_exhaustion`], the
     *recommended way of doing this is to pass a `limit` that only bounds `count`, as the
     *`size` limit can always be overwritten.
     */
    continue_migrate: TxDescriptor<Anonymize<I2psb0sladd863>>;
    /**
     *Migrate the list of top keys by iterating each of them one by one.
     *
     *This does not affect the global migration process tracker ([`MigrationProcess`]), and
     *should only be used in case any keys are leftover due to a bug.
     */
    migrate_custom_top: TxDescriptor<Anonymize<I585tk8khua0gk>>;
    /**
     *Migrate the list of child keys by iterating each of them one by one.
     *
     *All of the given child keys must be present under one `child_root`.
     *
     *This does not affect the global migration process tracker ([`MigrationProcess`]), and
     *should only be used in case any keys are leftover due to a bug.
     */
    migrate_custom_child: TxDescriptor<Anonymize<I3ut99di214ru2>>;
    /**
     *Set the maximum limit of the signed migration.
     */
    set_signed_max_limits: TxDescriptor<Anonymize<Iemkp87d26vsbh>>;
    /**
     *Forcefully set the progress the running migration.
     *
     *This is only useful in one case: the next key to migrate is too big to be migrated with
     *a signed account, in a parachain context, and we simply want to skip it. A reasonable
     *example of this would be `:code:`, which is both very expensive to migrate, and commonly
     *used, so probably it is already migrated.
     *
     *In case you mess things up, you can also, in principle, use this to reset the migration
     *process.
     */
    force_set_progress: TxDescriptor<Anonymize<I4ahfrt5dscf6q>>;
  };
  ConvictionVoting: {
    /**
     *Vote in a poll. If `vote.is_aye()`, the vote is to enact the proposal;
     *otherwise it is a vote to keep the status quo.
     *
     *The dispatch origin of this call must be _Signed_.
     *
     *- `poll_index`: The index of the poll to vote for.
     *- `vote`: The vote configuration.
     *
     *Weight: `O(R)` where R is the number of polls the voter has voted on.
     */
    vote: TxDescriptor<Anonymize<Idnsr2pndm36h0>>;
    /**
     *Delegate the voting power (with some given conviction) of the sending account for a
     *particular class of polls.
     *
     *The balance delegated is locked for as long as it's delegated, and thereafter for the
     *time appropriate for the conviction's lock period.
     *
     *The dispatch origin of this call must be _Signed_, and the signing account must either:
     *  - be delegating already; or
     *  - have no voting activity (if there is, then it will need to be removed through
     *    `remove_vote`).
     *
     *- `to`: The account whose voting the `target` account's voting power will follow.
     *- `class`: The class of polls to delegate. To delegate multiple classes, multiple calls
     *  to this function are required.
     *- `conviction`: The conviction that will be attached to the delegated votes. When the
     *  account is undelegated, the funds will be locked for the corresponding period.
     *- `balance`: The amount of the account's balance to be used in delegating. This must not
     *  be more than the account's current balance.
     *
     *Emits `Delegated`.
     *
     *Weight: `O(R)` where R is the number of polls the voter delegating to has
     *  voted on. Weight is initially charged as if maximum votes, but is refunded later.
     */
    delegate: TxDescriptor<Anonymize<Itcpv4hqecjfj>>;
    /**
     *Undelegate the voting power of the sending account for a particular class of polls.
     *
     *Tokens may be unlocked following once an amount of time consistent with the lock period
     *of the conviction with which the delegation was issued has passed.
     *
     *The dispatch origin of this call must be _Signed_ and the signing account must be
     *currently delegating.
     *
     *- `class`: The class of polls to remove the delegation from.
     *
     *Emits `Undelegated`.
     *
     *Weight: `O(R)` where R is the number of polls the voter delegating to has
     *  voted on. Weight is initially charged as if maximum votes, but is refunded later.
     */
    undelegate: TxDescriptor<Anonymize<I8steo882k7qns>>;
    /**
     *Remove the lock caused by prior voting/delegating which has expired within a particular
     *class.
     *
     *The dispatch origin of this call must be _Signed_.
     *
     *- `class`: The class of polls to unlock.
     *- `target`: The account to remove the lock on.
     *
     *Weight: `O(R)` with R number of vote of target.
     */
    unlock: TxDescriptor<Anonymize<I9qtj66dgng975>>;
    /**
     *Remove a vote for a poll.
     *
     *If:
     *- the poll was cancelled, or
     *- the poll is ongoing, or
     *- the poll has ended such that
     *  - the vote of the account was in opposition to the result; or
     *  - there was no conviction to the account's vote; or
     *  - the account made a split vote
     *...then the vote is removed cleanly and a following call to `unlock` may result in more
     *funds being available.
     *
     *If, however, the poll has ended and:
     *- it finished corresponding to the vote of the account, and
     *- the account made a standard vote with conviction, and
     *- the lock period of the conviction is not over
     *...then the lock will be aggregated into the overall account's lock, which may involve
     **overlocking* (where the two locks are combined into a single lock that is the maximum
     *of both the amount locked and the time is it locked for).
     *
     *The dispatch origin of this call must be _Signed_, and the signer must have a vote
     *registered for poll `index`.
     *
     *- `index`: The index of poll of the vote to be removed.
     *- `class`: Optional parameter, if given it indicates the class of the poll. For polls
     *  which have finished or are cancelled, this must be `Some`.
     *
     *Weight: `O(R + log R)` where R is the number of polls that `target` has voted on.
     *  Weight is calculated for the maximum number of vote.
     */
    remove_vote: TxDescriptor<Anonymize<I5f178ab6b89t3>>;
    /**
     *Remove a vote for a poll.
     *
     *If the `target` is equal to the signer, then this function is exactly equivalent to
     *`remove_vote`. If not equal to the signer, then the vote must have expired,
     *either because the poll was cancelled, because the voter lost the poll or
     *because the conviction period is over.
     *
     *The dispatch origin of this call must be _Signed_.
     *
     *- `target`: The account of the vote to be removed; this account must have voted for poll
     *  `index`.
     *- `index`: The index of poll of the vote to be removed.
     *- `class`: The class of the poll.
     *
     *Weight: `O(R + log R)` where R is the number of polls that `target` has voted on.
     *  Weight is calculated for the maximum number of vote.
     */
    remove_other_vote: TxDescriptor<Anonymize<Iduerupfbc8ruc>>;
  };
  Referenda: {
    /**
     *Propose a referendum on a privileged action.
     *
     *- `origin`: must be `SubmitOrigin` and the account must have `SubmissionDeposit` funds
     *  available.
     *- `proposal_origin`: The origin from which the proposal should be executed.
     *- `proposal`: The proposal.
     *- `enactment_moment`: The moment that the proposal should be enacted.
     *
     *Emits `Submitted`.
     */
    submit: TxDescriptor<Anonymize<I1q9ffekvj417t>>;
    /**
     *Post the Decision Deposit for a referendum.
     *
     *- `origin`: must be `Signed` and the account must have funds available for the
     *  referendum's track's Decision Deposit.
     *- `index`: The index of the submitted referendum whose Decision Deposit is yet to be
     *  posted.
     *
     *Emits `DecisionDepositPlaced`.
     */
    place_decision_deposit: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *Refund the Decision Deposit for a closed referendum back to the depositor.
     *
     *- `origin`: must be `Signed` or `Root`.
     *- `index`: The index of a closed referendum whose Decision Deposit has not yet been
     *  refunded.
     *
     *Emits `DecisionDepositRefunded`.
     */
    refund_decision_deposit: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *Cancel an ongoing referendum.
     *
     *- `origin`: must be the `CancelOrigin`.
     *- `index`: The index of the referendum to be cancelled.
     *
     *Emits `Cancelled`.
     */
    cancel: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *Cancel an ongoing referendum and slash the deposits.
     *
     *- `origin`: must be the `KillOrigin`.
     *- `index`: The index of the referendum to be cancelled.
     *
     *Emits `Killed` and `DepositSlashed`.
     */
    kill: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *Advance a referendum onto its next logical state. Only used internally.
     *
     *- `origin`: must be `Root`.
     *- `index`: the referendum to be advanced.
     */
    nudge_referendum: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *Advance a track onto its next logical state. Only used internally.
     *
     *- `origin`: must be `Root`.
     *- `track`: the track to be advanced.
     *
     *Action item for when there is now one fewer referendum in the deciding phase and the
     *`DecidingCount` is not yet updated. This means that we should either:
     *- begin deciding another referendum (and leave `DecidingCount` alone); or
     *- decrement `DecidingCount`.
     */
    one_fewer_deciding: TxDescriptor<Anonymize<Icbio0e1f0034b>>;
    /**
     *Refund the Submission Deposit for a closed referendum back to the depositor.
     *
     *- `origin`: must be `Signed` or `Root`.
     *- `index`: The index of a closed referendum whose Submission Deposit has not yet been
     *  refunded.
     *
     *Emits `SubmissionDepositRefunded`.
     */
    refund_submission_deposit: TxDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *Set or clear metadata of a referendum.
     *
     *Parameters:
     *- `origin`: Must be `Signed` by a creator of a referendum or by anyone to clear a
     *  metadata of a finished referendum.
     *- `index`:  The index of a referendum to set or clear metadata for.
     *- `maybe_hash`: The hash of an on-chain stored preimage. `None` to clear a metadata.
     */
    set_metadata: TxDescriptor<Anonymize<I8c0vkqjjipnuj>>;
  };
  Whitelist: {
    /**
        
         */
    whitelist_call: TxDescriptor<Anonymize<I1adbcfi5uc62r>>;
    /**
        
         */
    remove_whitelisted_call: TxDescriptor<Anonymize<I1adbcfi5uc62r>>;
    /**
        
         */
    dispatch_whitelisted_call: TxDescriptor<Anonymize<Ibf6ucefn8fh49>>;
    /**
        
         */
    dispatch_whitelisted_call_with_preimage: TxDescriptor<
      Anonymize<I6p92qik9qvgb2>
    >;
  };
  Dispatcher: {
    /**
        
         */
    dispatch_as_treasury: TxDescriptor<Anonymize<I6p92qik9qvgb2>>;
    /**
        
         */
    dispatch_as_aave_manager: TxDescriptor<Anonymize<I6p92qik9qvgb2>>;
    /**
     *Sets the Aave manager account to be used as origin for dispatching calls.
     *
     *This doesn't actually changes any ACL in the pool.
     *
     *This is intented to be mainly used in testnet environments, where the manager account
     *can be different.
     */
    note_aave_manager: TxDescriptor<Anonymize<Icbccs0ug47ilf>>;
  };
  AssetRegistry: {
    /**
     *Register a new asset.
     *
     *New asset is given `NextAssetId` - sequential asset id
     *
     *Asset's id is optional and it can't be used by another asset if it's provided.
     *Provided `asset_id` must be from within reserved range.
     *If `asset_id` is `None`, new asset is given id for sequential ids.
     *
     *Asset's name is optional and it can't be used by another asset if it's provided.
     *Adds mapping between `name` and assigned `asset_id` so asset id can be retrieved by name too (Note: this approach is used in AMM implementation (xyk))
     *
     *Emits 'Registered` event when successful.
     */
    register: TxDescriptor<Anonymize<Iejcu4gr9du24t>>;
    /**
     *Update registered asset.
     *
     *All parameteres are optional and value is not updated if param is `None`.
     *
     *`decimals` - can be update by `UpdateOrigin` only if it wasn't set yet. Only
     *`RegistryOrigin` can update `decimals` if it was previously set.
     *
     *`location` - can be updated only by `RegistryOrigin`.
     *
     *Emits `Updated` event when successful.
     */
    update: TxDescriptor<Anonymize<I9hlpdu483dt8k>>;
    /**
        
         */
    register_external: TxDescriptor<Anonymize<I4a8hon12idk34>>;
    /**
        
         */
    ban_asset: TxDescriptor<Anonymize<Ia5le7udkgbaq9>>;
    /**
        
         */
    unban_asset: TxDescriptor<Anonymize<Ia5le7udkgbaq9>>;
  };
  Claims: {
    /**
     *Claim xHDX by providing signed message with Ethereum address.
     */
    claim: TxDescriptor<Anonymize<Ib2p3kr78drjc1>>;
  };
  Omnipool: {
    /**
     *Add new token to omnipool in quantity `amount` at price `initial_price`
     *
     *Initial liquidity must be transferred to pool's account for this new token manually prior to calling `add_token`.
     *
     *Initial liquidity is pool's account balance of the token.
     *
     *Position NFT token is minted for `position_owner`.
     *
     *Parameters:
     *- `asset`: The identifier of the new asset added to the pool. Must be registered in Asset registry
     *- `initial_price`: Initial price
     *- `position_owner`: account id for which share are distributed in form on NFT
     *- `weight_cap`: asset weight cap
     *
     *Emits `TokenAdded` event when successful.
     *
     */
    add_token: TxDescriptor<Anonymize<Ida2ijjar0n0j3>>;
    /**
     *Add liquidity of asset `asset` in quantity `amount` to Omnipool
     *
     *`add_liquidity` adds specified asset amount to Omnipool and in exchange gives the origin
     *corresponding shares amount in form of NFT at current price.
     *
     *Asset's tradable state must contain ADD_LIQUIDITY flag, otherwise `NotAllowed` error is returned.
     *
     *NFT is minted using NTFHandler which implements non-fungibles traits from frame_support.
     *
     *Asset weight cap must be respected, otherwise `AssetWeightExceeded` error is returned.
     *Asset weight is ratio between new HubAsset reserve and total reserve of Hub asset in Omnipool.
     *
     *Add liquidity fails if price difference between spot price and oracle price is higher than allowed by `PriceBarrier`.
     *
     *Parameters:
     *- `asset`: The identifier of the new asset added to the pool. Must be already in the pool
     *- `amount`: Amount of asset added to omnipool
     *
     *Emits `LiquidityAdded` event when successful.
     *
     */
    add_liquidity: TxDescriptor<Anonymize<Ing3etrevsfg0>>;
    /**
     *Add liquidity of asset `asset` in quantity `amount` to Omnipool.
     *
     *Limit protection is applied.
     *
     *`add_liquidity` adds specified asset amount to Omnipool and in exchange gives the origin
     *corresponding shares amount in form of NFT at current price.
     *
     *Asset's tradable state must contain ADD_LIQUIDITY flag, otherwise `NotAllowed` error is returned.
     *
     *NFT is minted using NTFHandler which implements non-fungibles traits from frame_support.
     *
     *Asset weight cap must be respected, otherwise `AssetWeightExceeded` error is returned.
     *Asset weight is ratio between new HubAsset reserve and total reserve of Hub asset in Omnipool.
     *
     *Add liquidity fails if price difference between spot price and oracle price is higher than allowed by `PriceBarrier`.
     *
     *Parameters:
     *- `asset`: The identifier of the new asset added to the pool. Must be already in the pool
     *- `amount`: Amount of asset added to omnipool
     *- `min_shares_limit`: The min amount of delta share asset the user should receive in the position
     *
     *Emits `LiquidityAdded` event when successful.
     *
     */
    add_liquidity_with_limit: TxDescriptor<Anonymize<Ietsl92b11kilg>>;
    /**
     *Remove liquidity of asset `asset` in quantity `amount` from Omnipool
     *
     *`remove_liquidity` removes specified shares amount from given PositionId (NFT instance).
     *
     *Asset's tradable state must contain REMOVE_LIQUIDITY flag, otherwise `NotAllowed` error is returned.
     *
     *if all shares from given position are removed, position is destroyed and NFT is burned.
     *
     *Remove liquidity fails if price difference between spot price and oracle price is higher than allowed by `PriceBarrier`.
     *
     *Dynamic withdrawal fee is applied if withdrawal is not safe. It is calculated using spot price and external price oracle.
     *Withdrawal is considered safe when trading is disabled.
     *
     *Parameters:
     *- `position_id`: The identifier of position which liquidity is removed from.
     *- `amount`: Amount of shares removed from omnipool
     *
     *Emits `LiquidityRemoved` event when successful.
     *
     */
    remove_liquidity: TxDescriptor<Anonymize<Icqdi7b9m95ug3>>;
    /**
     *Remove liquidity of asset `asset` in quantity `amount` from Omnipool
     *
     *Limit protection is applied.
     *
     *`remove_liquidity` removes specified shares amount from given PositionId (NFT instance).
     *
     *Asset's tradable state must contain REMOVE_LIQUIDITY flag, otherwise `NotAllowed` error is returned.
     *
     *if all shares from given position are removed, position is destroyed and NFT is burned.
     *
     *Remove liquidity fails if price difference between spot price and oracle price is higher than allowed by `PriceBarrier`.
     *
     *Dynamic withdrawal fee is applied if withdrawal is not safe. It is calculated using spot price and external price oracle.
     *Withdrawal is considered safe when trading is disabled.
     *
     *Parameters:
     *- `position_id`: The identifier of position which liquidity is removed from.
     *- `amount`: Amount of shares removed from omnipool
     *- `min_limit`: The min amount of asset to be removed for the user
     *
     *Emits `LiquidityRemoved` event when successful.
     *
     */
    remove_liquidity_with_limit: TxDescriptor<Anonymize<Ieuqv44kptstcs>>;
    /**
     *Sacrifice LP position in favor of pool.
     *
     *A position is destroyed and liquidity owned by LP becomes pool owned liquidity.
     *
     *Only owner of position can perform this action.
     *
     *Emits `PositionDestroyed`.
     */
    sacrifice_position: TxDescriptor<Anonymize<I6vhvcln14dp4d>>;
    /**
     *Execute a swap of `asset_in` for `asset_out`.
     *
     *Price is determined by the Omnipool.
     *
     *Hub asset is traded separately.
     *
     *Asset's tradable states must contain SELL flag for asset_in and BUY flag for asset_out, otherwise `NotAllowed` error is returned.
     *
     *Parameters:
     *- `asset_in`: ID of asset sold to the pool
     *- `asset_out`: ID of asset bought from the pool
     *- `amount`: Amount of asset sold
     *- `min_buy_amount`: Minimum amount required to receive
     *
     *Emits `SellExecuted` event when successful. Deprecated.
     *Emits `pallet_broadcast::Swapped` event when successful.
     *
     */
    sell: TxDescriptor<Anonymize<Ievca65alkkho9>>;
    /**
     *Execute a swap of `asset_out` for `asset_in`.
     *
     *Price is determined by the Omnipool.
     *
     *Hub asset is traded separately.
     *
     *Asset's tradable states must contain SELL flag for asset_in and BUY flag for asset_out, otherwise `NotAllowed` error is returned.
     *
     *Parameters:
     *- `asset_in`: ID of asset sold to the pool
     *- `asset_out`: ID of asset bought from the pool
     *- `amount`: Amount of asset sold
     *- `max_sell_amount`: Maximum amount to be sold.
     *
     *Emits `BuyExecuted` event when successful. Deprecated.
     *Emits `pallet_broadcast::Swapped` event when successful.
     *
     */
    buy: TxDescriptor<Anonymize<I2qkf9i0e8mf1f>>;
    /**
     *Update asset's tradable state.
     *
     *Parameters:
     *- `asset_id`: asset id
     *- `state`: new state
     *
     *Emits `TradableStateUpdated` event when successful.
     *
     */
    set_asset_tradable_state: TxDescriptor<Anonymize<Iefviakco48cs2>>;
    /**
     *Refund given amount of asset to a recipient.
     *
     *A refund is needed when a token is refused to be added to Omnipool, and initial liquidity of the asset has been already transferred to pool's account.
     *
     *Transfer can be executed only if asset is not in Omnipool and pool's balance has sufficient amount.
     *
     *Only `AuthorityOrigin` can perform this operation.
     *
     *Emits `AssetRefunded`
     */
    refund_refused_asset: TxDescriptor<Anonymize<Iakb7idgif10m8>>;
    /**
     *Update asset's weight cap
     *
     *Parameters:
     *- `asset_id`: asset id
     *- `cap`: new weight cap
     *
     *Emits `AssetWeightCapUpdated` event when successful.
     *
     */
    set_asset_weight_cap: TxDescriptor<Anonymize<Id7aqsj1u6b2r2>>;
    /**
     *Removes protocol liquidity.
     *
     *Protocol liquidity is liquidity from sacrificed positions. In order to remove protocol liquidity,
     *we need the know the price of the position at the time of sacrifice. Hence this specific call.
     *
     *Only `AuthorityOrigin` can perform this call.
     *
     *Note that sacrifice position will be deprecated in future. There is no longer a need for that.
     *
     *It works the same way as remove liquidity call, but position is temporary reconstructed.
     *
     */
    withdraw_protocol_liquidity: TxDescriptor<Anonymize<Icah19jgge5j3e>>;
    /**
     *Removes token from Omnipool.
     *
     *Asset's tradability must be FROZEN, otherwise `AssetNotFrozen` error is returned.
     *
     *Remaining shares must belong to protocol, otherwise `SharesRemaining` error is returned.
     *
     *Protocol's liquidity is transferred to the beneficiary account and hub asset amount is burned.
     *
     *Only `AuthorityOrigin` can perform this call.
     *
     *Emits `TokenRemoved` event when successful.
     */
    remove_token: TxDescriptor<Anonymize<I2bi2kbaaunr13>>;
  };
  TransactionPause: {
    /**
        
         */
    pause_transaction: TxDescriptor<Anonymize<Ian208gj7nqkdo>>;
    /**
        
         */
    unpause_transaction: TxDescriptor<Anonymize<Ian208gj7nqkdo>>;
  };
  Duster: {
    /**
     *Dust specified account.
     *IF account balance is < min. existential deposit of given currency, and account is allowed to
     *be dusted, the remaining balance is transferred to selected account (usually treasury).
     *
     *Caller is rewarded with chosen reward in native currency.
     */
    dust_account: TxDescriptor<Anonymize<I81d44muu393rf>>;
    /**
     *Add account to list of non-dustable account. Account whihc are excluded from udsting.
     *If such account should be dusted - `AccountBlacklisted` error is returned.
     *Only root can perform this action.
     */
    add_nondustable_account: TxDescriptor<Anonymize<Icbccs0ug47ilf>>;
    /**
     *Remove account from list of non-dustable accounts. That means account can be dusted again.
     */
    remove_nondustable_account: TxDescriptor<Anonymize<Icbccs0ug47ilf>>;
  };
  OmnipoolLiquidityMining: {
    /**
     *Create a new liquidity mining program with provided parameters.
     *
     *`owner` account has to have at least `total_rewards` balance. These funds will be
     *transferred from `owner` to farm account.
     *
     *The dispatch origin for this call must be `T::CreateOrigin`.
     *!!!WARN: `T::CreateOrigin` has power over funds of `owner`'s account and it should be
     *configured to trusted origin e.g Sudo or Governance.
     *
     *Parameters:
     *- `origin`: account allowed to create new liquidity mining program(root, governance).
     *- `total_rewards`: total rewards planned to distribute. These rewards will be
     *distributed between all yield farms in the global farm.
     *- `planned_yielding_periods`: planned number of periods to distribute `total_rewards`.
     *WARN: THIS IS NOT HARD DEADLINE. Not all rewards have to be distributed in
     *`planned_yielding_periods`. Rewards are distributed based on the situation in the yield
     *farms and can be distributed in a longer, though never in a shorter, time frame.
     *- `blocks_per_period`:  number of blocks in a single period. Min. number of blocks per
     *period is 1.
     *- `reward_currency`: payoff currency of rewards.
     *- `owner`: liq. mining farm owner. This account will be able to manage created
     *liquidity mining program.
     *- `yield_per_period`: percentage return on `reward_currency` of all farms.
     *- `min_deposit`: minimum amount of LP shares to be deposited into the liquidity mining by each user.
     *- `lrna_price_adjustment`: price adjustment between `[LRNA]` and `reward_currency`.
     *
     *Emits `GlobalFarmCreated` when successful.
     *
     */
    create_global_farm: TxDescriptor<Anonymize<I3iojc1k1m6nu7>>;
    /**
     *Terminate existing liq. mining program.
     *
     *Only farm owner can perform this action.
     *
     *WARN: To successfully terminate a global farm, farm have to be empty
     *(all yield farms in the global farm must be terminated).
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `global_farm_id`: id of global farm to be terminated.
     *
     *Emits `GlobalFarmTerminated` event when successful.
     *
     */
    terminate_global_farm: TxDescriptor<Anonymize<I9q8qmop6bko5m>>;
    /**
     *Create yield farm for given `asset_id` in the omnipool.
     *
     *Only farm owner can perform this action.
     *
     *Asset with `asset_id` has to be registered in the omnipool.
     *At most one `active` yield farm can exist in one global farm for the same `asset_id`.
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `global_farm_id`: global farm id to which a yield farm will be added.
     *- `asset_id`: id of a asset in the omnipool. Yield farm will be created
     *for this asset and user will be able to lock LP shares into this yield farm immediately.
     *- `multiplier`: yield farm's multiplier.
     *- `loyalty_curve`: curve to calculate loyalty multiplier to distribute rewards to users
     *with time incentive. `None` means no loyalty multiplier.
     *
     *Emits `YieldFarmCreated` event when successful.
     *
     */
    create_yield_farm: TxDescriptor<Anonymize<Ial2ta95n8ff3b>>;
    /**
     *Update yield farm's multiplier.
     *
     *Only farm owner can perform this action.
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `global_farm_id`: global farm id in which yield farm will be updated.
     *- `asset_id`: id of the asset identifying yield farm in the global farm.
     *- `multiplier`: new yield farm's multiplier.
     *
     *Emits `YieldFarmUpdated` event when successful.
     *
     */
    update_yield_farm: TxDescriptor<Anonymize<Iammrvujtc5lnk>>;
    /**
     *Stop liquidity miming for specific yield farm.
     *
     *This function claims rewards from `GlobalFarm` last time and stop yield farm
     *incentivization from a `GlobalFarm`. Users will be able to only withdraw
     *shares(with claiming) after calling this function.
     *`deposit_shares()` is not allowed on stopped yield farm.
     *
     *Only farm owner can perform this action.
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `global_farm_id`: farm id in which yield farm will be canceled.
     *- `asset_id`: id of the asset identifying yield farm in the global farm.
     *
     *Emits `YieldFarmStopped` event when successful.
     *
     */
    stop_yield_farm: TxDescriptor<Anonymize<I87j02rt3f17j8>>;
    /**
     *Resume incentivization of the asset represented by yield farm.
     *
     *This function resume incentivization of the asset from the `GlobalFarm` and
     *restore full functionality or the yield farm. Users will be able to deposit,
     *claim and withdraw again.
     *
     *WARN: Yield farm(and users) is NOT rewarded for time it was stopped.
     *
     *Only farm owner can perform this action.
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `global_farm_id`: global farm id in which yield farm will be resumed.
     *- `yield_farm_id`: id of the yield farm to be resumed.
     *- `asset_id`: id of the asset identifying yield farm in the global farm.
     *- `multiplier`: yield farm multiplier.
     *
     *Emits `YieldFarmResumed` event when successful.
     *
     */
    resume_yield_farm: TxDescriptor<Anonymize<Iasmn3c065hq91>>;
    /**
     *Terminate yield farm.
     *
     *This function marks a yield farm as ready to be removed from storage when it's empty. Users will
     *be able to only withdraw shares(without claiming rewards from yield farm). Unpaid rewards
     *will be transferred back to global farm and it will be used to distribute to other yield farms.
     *
     *Yield farm must be stopped before it can be terminated.
     *
     *Only global farm's owner can perform this action. Yield farm stays in the storage until it's
     *empty(all farm entries are withdrawn). Last withdrawn from yield farm trigger removing from
     *the storage.
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `global_farm_id`: global farm id in which yield farm should be terminated.
     *- `yield_farm_id`: id of yield farm to be terminated.
     *- `asset_id`: id of the asset identifying yield farm.
     *
     *Emits `YieldFarmTerminated` event when successful.
     *
     */
    terminate_yield_farm: TxDescriptor<Anonymize<Ia5kd7m19ap7ge>>;
    /**
     *Deposit omnipool position(LP shares) to a liquidity mining.
     *
     *This function transfers omnipool position from `origin` to pallet's account and mint NFT for
     *`origin` account. Minted NFT represents deposit in the liquidity mining. User can
     *deposit omnipool position as a whole(all the LP shares in the position).
     *
     *Parameters:
     *- `origin`: owner of the omnipool position to deposit into the liquidity mining.
     *- `global_farm_id`: id of global farm to which user wants to deposit LP shares.
     *- `yield_farm_id`: id of yield farm to deposit to.
     *- `position_id`: id of the omnipool position to be deposited into the liquidity mining.
     *
     *Emits `SharesDeposited` event when successful.
     *
     */
    deposit_shares: TxDescriptor<Anonymize<Ieq7brqoubndin>>;
    /**
     *Redeposit LP shares in the already locked omnipool position.
     *
     *This function create yield farm entry for existing deposit. Amount of redeposited LP
     *shares is same as amount shares which are already deposited in the deposit.
     *
     *This function DOESN'T create new deposit(NFT).
     *
     *Parameters:
     *- `origin`: owner of the deposit to redeposit.
     *- `global_farm_id`: id of the global farm to which user wants to redeposit LP shares.
     *- `yield_farm_id`: id of the yield farm to redeposit to.
     *- `deposit_id`: identifier of the deposit to redeposit.
     *
     *Emits `SharesRedeposited` event when successful.
     *
     */
    redeposit_shares: TxDescriptor<Anonymize<Ie8ft8rd6cil27>>;
    /**
     *Claim rewards from liquidity mining program for deposit represented by the `deposit_id`.
     *
     *This function calculate user rewards from liquidity mining and transfer rewards to `origin`
     *account. Claiming multiple time the same period is not allowed.
     *
     *Parameters:
     *- `origin`: owner of deposit.
     *- `deposit_id`: id of the deposit to claim rewards for.
     *- `yield_farm_id`: id of the yield farm to claim rewards from.
     *
     *Emits `RewardClaimed` event when successful.
     *
     */
    claim_rewards: TxDescriptor<Anonymize<I2k37dcoppgins>>;
    /**
     *This function claim rewards and withdraw LP shares from yield farm. Omnipool position
     *is transferred to origin only if this is last withdraw in the deposit and deposit is
     *destroyed. This function claim rewards only if yield farm is not terminated and user
     *didn't already claim rewards in current period.
     *
     *Unclaimable rewards represents rewards which user won't be able to claim because of
     *exiting early and these rewards will be transferred back to global farm for future
     *redistribution.
     *
     *Parameters:
     *- `origin`: owner of deposit.
     *- `deposit_id`: id of the deposit to claim rewards for.
     *- `yield_farm_id`: id of the yield farm to claim rewards from.
     *
     *Emits:
     ** `RewardClaimed` event if claimed rewards is > 0
     ** `SharesWithdrawn` event when successful
     ** `DepositDestroyed` event when this was last withdraw from the deposit and deposit was
     *destroyed.
     *
     */
    withdraw_shares: TxDescriptor<Anonymize<I2k37dcoppgins>>;
    /**
     *This extrinsic updates global farm's main parameters.
     *
     *The dispatch origin for this call must be `T::CreateOrigin`.
     *!!!WARN: `T::CreateOrigin` has power over funds of `owner`'s account and it should be
     *configured to trusted origin e.g Sudo or Governance.
     *
     *Parameters:
     *- `origin`: account allowed to create new liquidity mining program(root, governance).
     *- `global_farm_id`: id of the global farm to update.
     *- `planned_yielding_periods`: planned number of periods to distribute `total_rewards`.
     *- `yield_per_period`: percentage return on `reward_currency` of all farms.
     *- `min_deposit`: minimum amount of LP shares to be deposited into the liquidity mining by each user.
     *
     *Emits `GlobalFarmUpdated` event when successful.
     */
    update_global_farm: TxDescriptor<Anonymize<Ia05t9pjenemsb>>;
    /**
     *This function allows user to join multiple farms with a single omnipool position.
     *
     *Parameters:
     *- `origin`: owner of the omnipool position to deposit into the liquidity mining.
     *- `farm_entries`: list of farms to join.
     *- `position_id`: id of the omnipool position to be deposited into the liquidity mining.
     *
     *Emits `SharesDeposited` event for the first farm entry
     *Emits `SharesRedeposited` event for each farm entry after the first one
     */
    join_farms: TxDescriptor<Anonymize<I4rm8rabbdt645>>;
    /**
     *This function allows user to add liquidity then use that shares to join multiple farms.
     *
     *Parameters:
     *- `origin`: owner of the omnipool position to deposit into the liquidity mining.
     *- `farm_entries`: list of farms to join.
     *- `asset`: id of the asset to be deposited into the liquidity mining.
     *- `amount`: amount of the asset to be deposited into the liquidity mining.
     *- `min_shares_limit`: The min amount of delta share asset the user should receive in the position
     *
     *Emits `SharesDeposited` event for the first farm entry
     *Emits `SharesRedeposited` event for each farm entry after the first one
     */
    add_liquidity_and_join_farms: TxDescriptor<Anonymize<I9sh4kg79d0vn>>;
    /**
     *Exit from all specified yield farms
     *
     *This function will attempt to withdraw shares and claim rewards (if available) from all
     *specified yield farms for a given deposit.
     *
     *Parameters:
     *- `origin`: account owner of deposit(nft).
     *- `deposit_id`: id of the deposit to claim rewards for.
     *- `yield_farm_ids`: id(s) of yield farm(s) to exit from.
     *
     *Emits:
     ** `RewardClaimed` for each successful claim
     ** `SharesWithdrawn` for each successful withdrawal
     ** `DepositDestroyed` if the deposit is fully withdrawn
     *
     */
    exit_farms: TxDescriptor<Anonymize<I5k5ne4orot4oe>>;
    /**
     *This function allows user to add liquidity to stableswap pool,
     *then adding the stable shares as liquidity to omnipool
     *then use that omnipool shares to join multiple farms.
     *
     *If farm entries are not specified (empty vectoo), then the liquidities are still added to the pools
     *
     *Parameters:
     *- `origin`: owner of the omnipool position to deposit into the liquidity mining.
     *- `stable_pool_id`: id of the stableswap pool to add liquidity to.
     *- `stable_asset_amounts`: amount of each asset to be deposited into the stableswap pool.
     *- `farm_entries`: list of farms to join.
     *
     *Emits `LiquidityAdded` events from both pool
     *Emits `SharesDeposited` event for the first farm entry
     *Emits `SharesRedeposited` event for each farm entry after the first one
     *
     */
    add_liquidity_stableswap_omnipool_and_join_farms: TxDescriptor<
      Anonymize<Idtg418thlu95>
    >;
  };
  OTC: {
    /**
     *Create a new OTC order
     *
     *Parameters:
     *- `asset_in`: Asset which is being bought
     *- `asset_out`: Asset which is being sold
     *- `amount_in`: Amount that the order is seeking to buy
     *- `amount_out`: Amount that the order is selling
     *- `partially_fillable`: Flag indicating whether users can fill the order partially
     *
     *Validations:
     *- asset_in must be registered
     *- amount_in must be higher than the existential deposit of asset_in multiplied by
     *  ExistentialDepositMultiplier
     *- amount_out must be higher than the existential deposit of asset_out multiplied by
     *  ExistentialDepositMultiplier
     *
     *Events:
     *- `Placed` event when successful.
     */
    place_order: TxDescriptor<Anonymize<I8utns9aeu3t6o>>;
    /**
     *Fill an OTC order (partially)
     *
     *Parameters:
     *- `order_id`: ID of the order
     *- `amount_in`: Amount with which the order is being filled
     *
     *Validations:
     *- order must be partially_fillable
     *- after the partial_fill, the remaining order.amount_in must be higher than the existential deposit
     *  of asset_in multiplied by ExistentialDepositMultiplier
     *- after the partial_fill, the remaining order.amount_out must be higher than the existential deposit
     *  of asset_out multiplied by ExistentialDepositMultiplier
     *
     *Events:
     *`PartiallyFilled` event when successful. Deprecated.
     *`pallet_broadcast::Swapped` event when successful.
     */
    partial_fill_order: TxDescriptor<Anonymize<I35cf63e7kg5on>>;
    /**
     *Fill an OTC order (completely)
     *
     *Parameters:
     *- `order_id`: ID of the order
     *
     *Events:
     *`Filled` event when successful. Deprecated.
     *`pallet_broadcast::Swapped` event when successful.
     */
    fill_order: TxDescriptor<Anonymize<Ibq6b0nsk23kj8>>;
    /**
     *Cancel an open OTC order
     *
     *Parameters:
     *- `order_id`: ID of the order
     *- `asset`: Asset which is being filled
     *- `amount`: Amount which is being filled
     *
     *Validations:
     *- caller is order owner
     *
     *Emits `Cancelled` event when successful.
     */
    cancel_order: TxDescriptor<Anonymize<Ibq6b0nsk23kj8>>;
  };
  CircuitBreaker: {
    /**
     *Set trade volume limit for an asset.
     *
     *Parameters:
     *- `origin`: The dispatch origin for this call. Must be `UpdateLimitsOrigin`
     *- `asset_id`: The identifier of an asset
     *- `trade_volume_limit`: New trade volume limit represented as a percentage
     *
     *Emits `TradeVolumeLimitChanged` event when successful.
     *
     */
    set_trade_volume_limit: TxDescriptor<Anonymize<I2i1tilmsb1rl1>>;
    /**
     *Set add liquidity limit for an asset.
     *
     *Parameters:
     *- `origin`: The dispatch origin for this call. Must be `UpdateLimitsOrigin`
     *- `asset_id`: The identifier of an asset
     *- `liquidity_limit`: Optional add liquidity limit represented as a percentage
     *
     *Emits `AddLiquidityLimitChanged` event when successful.
     *
     */
    set_add_liquidity_limit: TxDescriptor<Anonymize<I4l0u1h71fhj81>>;
    /**
     *Set remove liquidity limit for an asset.
     *
     *Parameters:
     *- `origin`: The dispatch origin for this call. Must be `UpdateLimitsOrigin`
     *- `asset_id`: The identifier of an asset
     *- `liquidity_limit`: Optional remove liquidity limit represented as a percentage
     *
     *Emits `RemoveLiquidityLimitChanged` event when successful.
     *
     */
    set_remove_liquidity_limit: TxDescriptor<Anonymize<I4l0u1h71fhj81>>;
  };
  Router: {
    /**
     *Executes a sell with a series of trades specified in the route.
     *The price for each trade is determined by the corresponding AMM.
     *
     *- `origin`: The executor of the trade
     *- `asset_in`: The identifier of the asset to sell
     *- `asset_out`: The identifier of the asset to receive
     *- `amount_in`: The amount of `asset_in` to sell
     *- `min_amount_out`: The minimum amount of `asset_out` to receive.
     *- `route`: Series of [`Trade<AssetId>`] to be executed. A [`Trade<AssetId>`] specifies the asset pair (`asset_in`, `asset_out`) and the AMM (`pool`) in which the trade is executed.
     *		   If not specified, than the on-chain route is used.
     *		   If no on-chain is present, then omnipool route is used as default
     *
     *Emits `RouteExecuted` when successful.
     */
    sell: TxDescriptor<Anonymize<Iet9su1uri0qgo>>;
    /**
     *Executes a buy with a series of trades specified in the route.
     *The price for each trade is determined by the corresponding AMM.
     *
     *- `origin`: The executor of the trade
     *- `asset_in`: The identifier of the asset to be swapped to buy `asset_out`
     *- `asset_out`: The identifier of the asset to buy
     *- `amount_out`: The amount of `asset_out` to buy
     *- `max_amount_in`: The max amount of `asset_in` to spend on the buy.
     *- `route`: Series of [`Trade<AssetId>`] to be executed. A [`Trade<AssetId>`] specifies the asset pair (`asset_in`, `asset_out`) and the AMM (`pool`) in which the trade is executed.
     *		   If not specified, than the on-chain route is used.
     *		   If no on-chain is present, then omnipool route is used as default
     *
     *Emits `RouteExecuted` when successful.
     */
    buy: TxDescriptor<Anonymize<I242odhgbhik24>>;
    /**
     *Sets the on-chain route for a given asset pair.
     *
     *The new route is validated by being executed in a dry-run mode
     *
     *If there is no route explicitly set for an asset pair, then we use the omnipool route as default.
     *
     *When a new route is set, we compare it to the existing (or default) route.
     *The comparison happens by calculating sell amount_outs for the routes, but also for the inversed routes.
     *
     *The route is stored in an ordered manner, based on the oder of the ids in the asset pair.
     *
     *If the route is set successfully, then the fee is payed back.
     *
     *- `origin`: The origin of the route setter
     *- `asset_pair`: The identifier of the asset-pair for which the route is set
     *- `new_route`: Series of [`Trade<AssetId>`] to be executed. A [`Trade<AssetId>`] specifies the asset pair (`asset_in`, `asset_out`) and the AMM (`pool`) in which the trade is executed.
     *
     *Emits `RouteUpdated` when successful.
     *
     *Fails with `RouteUpdateIsNotSuccessful` error when failed to set the route
     *
     */
    set_route: TxDescriptor<Anonymize<I7o081p6vv5gqs>>;
    /**
     *Force inserts the on-chain route for a given asset pair, so there is no any validation for the route
     *
     *Can only be called by T::ForceInsertOrigin
     *
     *The route is stored in an ordered manner, based on the oder of the ids in the asset pair.
     *
     *If the route is set successfully, then the fee is payed back.
     *
     *- `origin`: The origin of the route setter
     *- `asset_pair`: The identifier of the asset-pair for which the route is set
     *- `new_route`: Series of [`Trade<AssetId>`] to be executed. A [`Trade<AssetId>`] specifies the asset pair (`asset_in`, `asset_out`) and the AMM (`pool`) in which the trade is executed.
     *
     *Emits `RouteUpdated` when successful.
     *
     */
    force_insert_route: TxDescriptor<Anonymize<I7o081p6vv5gqs>>;
    /**
     *Executes a sell with a series of trades specified in the route.
     *It sells all reducible user balance of `asset_in`
     *The price for each trade is determined by the corresponding AMM.
     *
     *- `origin`: The executor of the trade
     *- `asset_in`: The identifier of the asset to sell
     *- `asset_out`: The identifier of the asset to receive
     *- `min_amount_out`: The minimum amount of `asset_out` to receive.
     *- `route`: Series of [`Trade<AssetId>`] to be executed. A [`Trade<AssetId>`] specifies the asset pair (`asset_in`, `asset_out`) and the AMM (`pool`) in which the trade is executed.
     *		   If not specified, than the on-chain route is used.
     *		   If no on-chain is present, then omnipool route is used as default
     *
     *Emits `RouteExecuted` when successful.
     *
     */
    sell_all: TxDescriptor<Anonymize<Ic18k1k8u5726n>>;
  };
  Staking: {
    /**
     *Staking pallet initialization. This call will reserved `pot`'s balance to prevent
     *account dusting and start collecting fees from trades as rewards.
     *
     *`pot`’s account has to have a balance which will be reserved to prevent account dusting.
     *
     *Emits `StakingInitialized` event when successful.
     *
     */
    initialize_staking: TxDescriptor<undefined>;
    /**
     *Stake `amount` into a new staking position.
     *
     *`stake` locks specified `amount` into staking and creates new NFT representing staking
     *position.
     *Users can stake `NativeAssetId` balance which is not vested or already staked.
     *
     *Staking pallet must be initialized otherwise extrinsic will fail with error.
     *
     *Parameters:
     *- `amount`: Amount of native asset to be staked. `amount` can't be vested or already
     *staked
     *
     *Emits `PositionCreated` event when successful.
     *
     */
    stake: TxDescriptor<Anonymize<I3qt1hgg4djhgb>>;
    /**
     *Extrinsic to increase staked amount of existing staking position by specified `amount`.
     *
     *`increase_stake` increases staked amount of position specified by `postion_id` by the
     *`amount` specified by the user.
     *Staking position must exist and `origin` has to be the owner of the position.
     *Users can stake tokens which are not vested or already staked.
     *Position's params e.g points are updated to offset stake increase and rewards
     *accumulated until this point are paid and locked to the user.
     *
     *Parameters:
     *- `position_id`: The identifier of the position which stake will be increased.
     *- `amount`: Amount of native asset to be added to staked amount. `amount` can't be vested or
     *already staked
     *
     *Emits `StakeAdded` event when successful.
     *
     */
    increase_stake: TxDescriptor<Anonymize<Icqdi7b9m95ug3>>;
    /**
     *Claim rewards accumulated for specific staking position.
     *
     *Function calculates amount of rewards to pay for specified staking position based on
     *the amount of points position accumulated. Function also unlocks all the rewards locked
     *from `increase_stake` based on the amount of the points.
     *
     *This action is penalized by removing all the points and returning allocated unpaid rewards
     *for redistribution.
     *
     *Parameters:
     *- `position_id`: The identifier of the position to claim rewards for.
     *
     *Emits `RewardsClaimed` event when successful.
     *
     */
    claim: TxDescriptor<Anonymize<I6vhvcln14dp4d>>;
    /**
     *Function pays rewards, unlocks all the staked assets and destroys staking position
     *specified by `position_id`.
     *
     *Function calculates and pays latest rewards, unlocks all the locked rewards and staked
     *tokens for staking position and burns NFT representing staking position.
     *Unpaid allocated rewards are returned to the Staking for redistribution.
     *
     *Parameters:
     *- `position_id`: The identifier of the position to be destroyed.
     *
     *Emits `RewardsClaimed` and `Unstaked` events when successful.
     *
     */
    unstake: TxDescriptor<Anonymize<I6vhvcln14dp4d>>;
  };
  Stableswap: {
    /**
     *Create a stable pool with given list of assets.
     *
     *All assets must be correctly registered in `T::AssetRegistry`.
     *Note that this does not seed the pool with liquidity. Use `add_liquidity` to provide
     *initial liquidity.
     *
     *Parameters:
     *- `origin`: Must be T::AuthorityOrigin
     *- `share_asset`: Preregistered share asset identifier
     *- `assets`: List of Asset ids
     *- `amplification`: Pool amplification
     *- `fee`: fee to be applied on trade and liquidity operations
     *
     *Emits `PoolCreated` event if successful.
     */
    create_pool: TxDescriptor<Anonymize<I77a9b6eik0rui>>;
    /**
     *Update pool's fee.
     *
     *if pool does not exist, `PoolNotFound` is returned.
     *
     *Parameters:
     *- `origin`: Must be T::AuthorityOrigin
     *- `pool_id`: pool to update
     *- `fee`: new pool fee
     *
     *Emits `FeeUpdated` event if successful.
     */
    update_pool_fee: TxDescriptor<Anonymize<Ics8sn0t3vlpat>>;
    /**
     *Update pool's amplification.
     *
     *Parameters:
     *- `origin`: Must be T::AuthorityOrigin
     *- `pool_id`: pool to update
     *- `future_amplification`: new desired pool amplification
     *- `future_block`: future block number when the amplification is updated
     *
     *Emits `AmplificationUpdated` event if successful.
     */
    update_amplification: TxDescriptor<Anonymize<I6p5nbogrodkcc>>;
    /**
     *Add liquidity to selected pool.
     *
     *First call of `add_liquidity` must provide "initial liquidity" of all assets.
     *
     *If there is liquidity already in the pool, LP can provide liquidity of any number of pool assets.
     *
     *LP must have sufficient amount of each asset.
     *
     *Origin is given corresponding amount of shares.
     *
     *Parameters:
     *- `origin`: liquidity provider
     *- `pool_id`: Pool Id
     *- `assets`: asset id and liquidity amount provided
     *
     *Emits `LiquidityAdded` event when successful.
     *Emits `pallet_broadcast::Swapped` event when successful.
     */
    add_liquidity: TxDescriptor<Anonymize<I7pgj3rnfo83eg>>;
    /**
     *Add liquidity to selected pool given exact amount of shares to receive.
     *
     *Similar to `add_liquidity` but LP specifies exact amount of shares to receive.
     *
     *This functionality is used mainly by on-chain routing when a swap between Omnipool asset and stable asset is performed.
     *
     *Parameters:
     *- `origin`: liquidity provider
     *- `pool_id`: Pool Id
     *- `shares`: amount of shares to receive
     *- `asset_id`: asset id of an asset to provide as liquidity
     *- `max_asset_amount`: slippage limit. Max amount of asset.
     *
     *Emits `LiquidityAdded` event when successful.
     *Emits `pallet_broadcast::Swapped` event when successful.
     */
    add_liquidity_shares: TxDescriptor<Anonymize<Ic11mlh16sngai>>;
    /**
     *Remove liquidity from selected pool.
     *
     *Withdraws liquidity of selected asset from a pool.
     *
     *Share amount is burned and LP receives corresponding amount of chosen asset.
     *
     *Withdraw fee is applied to the asset amount.
     *
     *Parameters:
     *- `origin`: liquidity provider
     *- `pool_id`: Pool Id
     *- `asset_id`: id of asset to receive
     *- 'share_amount': amount of shares to withdraw
     *- 'min_amount_out': minimum amount to receive
     *
     *Emits `LiquidityRemoved` event when successful.
     *Emits `pallet_broadcast::Swapped` event when successful.
     */
    remove_liquidity_one_asset: TxDescriptor<Anonymize<I4vbsn8c7ui70f>>;
    /**
     *Remove liquidity from selected pool by specifying exact amount of asset to receive.
     *
     *Similar to `remove_liquidity_one_asset` but LP specifies exact amount of asset to receive instead of share amount.
     *
     *Parameters:
     *- `origin`: liquidity provider
     *- `pool_id`: Pool Id
     *- `asset_id`: id of asset to receive
     *- 'amount': amount of asset to receive
     *- 'max_share_amount': Slippage limit. Max amount of shares to burn.
     *
     *Emits `LiquidityRemoved` event when successful.
     *Emits `pallet_broadcast::Swapped` event when successful.
     */
    withdraw_asset_amount: TxDescriptor<Anonymize<I60m5cjc6e18ab>>;
    /**
     *Execute a swap of `asset_in` for `asset_out`.
     *
     *Parameters:
     *- `origin`: origin of the caller
     *- `pool_id`: Id of a pool
     *- `asset_in`: ID of asset sold to the pool
     *- `asset_out`: ID of asset bought from the pool
     *- `amount_in`: Amount of asset to be sold to the pool
     *- `min_buy_amount`: Minimum amount required to receive
     *
     *Emits `SellExecuted` event when successful. Deprecated.
     *Emits `pallet_broadcast::Swapped` event when successful.
     *
     */
    sell: TxDescriptor<Anonymize<Iauknf9up388mv>>;
    /**
     *Execute a swap of `asset_in` for `asset_out`.
     *
     *Parameters:
     *- `origin`:
     *- `pool_id`: Id of a pool
     *- `asset_out`: ID of asset bought from the pool
     *- `asset_in`: ID of asset sold to the pool
     *- `amount_out`: Amount of asset to receive from the pool
     *- `max_sell_amount`: Maximum amount allowed to be sold
     *
     *Emits `BuyExecuted` event when successful. Deprecated.
     *Emits `pallet_broadcast::Swapped` event when successful.
     *
     */
    buy: TxDescriptor<Anonymize<Ieh252ua9757u1>>;
    /**
        
         */
    set_asset_tradable_state: TxDescriptor<Anonymize<Iest0fomljvrb6>>;
    /**
        
         */
    remove_liquidity: TxDescriptor<Anonymize<I2d6orhhgh5et2>>;
  };
  Bonds: {
    /**
     *Issue new fungible bonds.
     *New asset id is registered and assigned to the bonds.
     *The number of bonds the issuer receives is 1:1 to the `amount` of the underlying asset
     *minus the protocol fee.
     *The bond asset is registered with the empty string for the asset name,
     *and with the same existential deposit as of the underlying asset.
     *Bonds can be redeemed for the underlying asset once mature.
     *Protocol fee is applied to the amount, and transferred to `T::FeeReceiver`.
     *When issuing new bonds with the underlying asset and maturity that matches existing bonds,
     *new amount of these existing bonds is issued, instead of registering new bonds.
     *It's possible to issue new bonds for bonds that are already mature.
     *
     *Parameters:
     *- `origin`: issuer of new bonds, needs to be `T::IssueOrigin`
     *- `asset_id`: underlying asset id
     *- `amount`: the amount of the underlying asset
     *- `maturity`: Unix time in milliseconds, when the bonds will be mature.
     *
     *Emits `BondTokenCreated` event when successful and new bonds were registered.
     *Emits `BondsIssued` event when successful.
     *
     */
    issue: TxDescriptor<Anonymize<I3i06ijrvdoq97>>;
    /**
     *Redeem bonds for the underlying asset.
     *The amount of the underlying asset the `origin` receives is 1:1 to the `amount` of the bonds.
     *Anyone who holds the bonds is able to redeem them.
     *Bonds can be both partially or fully redeemed.
     *
     *Parameters:
     *- `origin`: account id
     *- `asset_id`: bond asset id
     *- `amount`: the amount of the bonds to redeem for the underlying asset
     *
     *Emits `BondsRedeemed` event when successful.
     *
     */
    redeem: TxDescriptor<Anonymize<Ibc2f5cr6dqguj>>;
  };
  OtcSettlements: {
    /**
     *Close an existing OTC arbitrage opportunity.
     *
     *Executes a trade between an OTC order and some route.
     *If the OTC order is partially fillable, the extrinsic fails if the existing arbitrage
     *opportunity is not closed or reduced after the trade.
     *If the OTC order is not partially fillable, fails if there is no profit after the trade.
     *
     *`Origin` calling this extrinsic is not paying or receiving anything.
     *
     *The profit made by closing the arbitrage is transferred to `FeeReceiver`.
     *
     *Parameters:
     *- `origin`: Signed or unsigned origin. Unsigned origin doesn't pay the TX fee,
     *			but can be submitted only by a collator.
     *- `otc_id`: ID of the OTC order with existing arbitrage opportunity.
     *- `amount`: Amount necessary to close the arb.
     *- `route`: The route we trade against. Required for the fee calculation.
     *
     *Emits `Executed` event when successful.
     *
     */
    settle_otc_order: TxDescriptor<Anonymize<Ia6sgngioc9e>>;
  };
  LBP: {
    /**
     *Create a new liquidity bootstrapping pool for given asset pair.
     *
     *For any asset pair, only one pool can exist at a time.
     *
     *The dispatch origin for this call must be `T::CreatePoolOrigin`.
     *The pool is created with initial liquidity provided by the `pool_owner` who must have
     *sufficient funds free.
     *
     *The pool starts uninitialized and update_pool call should be called once created to set the start block.
     *
     *This function should be dispatched from governing entity `T::CreatePoolOrigin`
     *
     *Parameters:
     *- `pool_owner`: the future owner of the new pool.
     *- `asset_a`: { asset_id, amount } Asset ID and initial liquidity amount.
     *- `asset_b`: { asset_id, amount } Asset ID and initial liquidity amount.
     *- `initial_weight`: Initial weight of the asset_a. 1_000_000 corresponding to 1% and 100_000_000 to 100%
     *this should be higher than final weight
     *- `final_weight`: Final weight of the asset_a. 1_000_000 corresponding to 1% and 100_000_000 to 100%
     *this should be lower than initial weight
     *- `weight_curve`: The weight function used to update the LBP weights. Currently,
     *there is only one weight function implemented, the linear function.
     *- `fee`: The trading fee charged on every trade distributed to `fee_collector`.
     *- `fee_collector`: The account to which trading fees will be transferred.
     *- `repay_target`: The amount of tokens to repay to separate fee_collector account. Until this amount is
     *reached, fee will be increased to 20% and taken from the pool
     *
     *Emits `PoolCreated` event when successful.
     *
     *BEWARE: We are taking the fee from the accumulated asset. If the accumulated asset is sold to the pool,
     *the fee cost is transferred to the pool. If its bought from the pool the buyer bears the cost.
     *This increases the price of the sold asset on every trade. Make sure to only run this with
     *previously illiquid assets.
     */
    create_pool: TxDescriptor<Anonymize<I3qhjmr9i9etho>>;
    /**
     *Update pool data of a pool.
     *
     *The dispatch origin for this call must be signed by the pool owner.
     *
     *The pool can be updated only if the sale has not already started.
     *
     *At least one of the following optional parameters has to be specified.
     *
     *Parameters:
     *- `pool_id`: The identifier of the pool to be updated.
     *- `start`: The new starting time of the sale. This parameter is optional.
     *- `end`: The new ending time of the sale. This parameter is optional.
     *- `initial_weight`: The new initial weight. This parameter is optional.
     *- `final_weight`: The new final weight. This parameter is optional.
     *- `fee`: The new trading fee charged on every trade. This parameter is optional.
     *- `fee_collector`: The new receiver of trading fees. This parameter is optional.
     *
     *Emits `PoolUpdated` event when successful.
     */
    update_pool_data: TxDescriptor<Anonymize<I13ss7bvftqcnq>>;
    /**
     *Add liquidity to a pool.
     *
     *Assets to add has to match the pool assets. At least one amount has to be non-zero.
     *
     *The dispatch origin for this call must be signed by the pool owner.
     *
     *Parameters:
     *- `pool_id`: The identifier of the pool
     *- `amount_a`: The identifier of the asset and the amount to add.
     *- `amount_b`: The identifier of the second asset and the amount to add.
     *
     *Emits `LiquidityAdded` event when successful.
     */
    add_liquidity: TxDescriptor<Anonymize<Ic3gahhrcopfnt>>;
    /**
     *Transfer all the liquidity from a pool back to the pool owner and destroy the pool.
     *The pool data are also removed from the storage.
     *
     *The pool can't be destroyed during the sale.
     *
     *The dispatch origin for this call must be signed by the pool owner.
     *
     *Parameters:
     *- `amount_a`: The identifier of the asset and the amount to add.
     *
     *Emits 'LiquidityRemoved' when successful.
     */
    remove_liquidity: TxDescriptor<Anonymize<I9n7ns8k72amhv>>;
    /**
     *Trade `asset_in` for `asset_out`.
     *
     *Executes a swap of `asset_in` for `asset_out`. Price is determined by the pool and is
     *affected by the amount and proportion of the pool assets and the weights.
     *
     *Trading `fee` is distributed to the `fee_collector`.
     *
     *Parameters:
     *- `asset_in`: The identifier of the asset being transferred from the account to the pool.
     *- `asset_out`: The identifier of the asset being transferred from the pool to the account.
     *- `amount`: The amount of `asset_in`
     *- `max_limit`: minimum amount of `asset_out` / amount of asset_out to be obtained from the pool in exchange for `asset_in`.
     *
     *Emits `SellExecuted` when successful. Deprecated.
     *Emits `pallet_broadcast::Swapped` when successful.
     */
    sell: TxDescriptor<Anonymize<I2co61imvsepb6>>;
    /**
     *Trade `asset_in` for `asset_out`.
     *
     *Executes a swap of `asset_in` for `asset_out`. Price is determined by the pool and is
     *affected by the amount and the proportion of the pool assets and the weights.
     *
     *Trading `fee` is distributed to the `fee_collector`.
     *
     *Parameters:
     *- `asset_in`: The identifier of the asset being transferred from the account to the pool.
     *- `asset_out`: The identifier of the asset being transferred from the pool to the account.
     *- `amount`: The amount of `asset_out`.
     *- `max_limit`: maximum amount of `asset_in` to be sold in exchange for `asset_out`.
     *
     *Emits `BuyExecuted` when successful. Deprecated.
     *Emits `pallet_broadcast::Swapped` when successful.
     */
    buy: TxDescriptor<Anonymize<I2co61imvsepb6>>;
  };
  XYK: {
    /**
     *Create new pool for given asset pair.
     *
     *Registers new pool for given asset pair (`asset a` and `asset b`) in asset registry.
     *Asset registry creates new id or returns previously created one if such pool existed before.
     *
     *Pool is created with initial liquidity provided by `origin`.
     *Shares are issued with specified initial price and represents proportion of asset in the pool.
     *
     *Emits `PoolCreated` event when successful.
     */
    create_pool: TxDescriptor<Anonymize<Icjk91npopm3h9>>;
    /**
     *Add liquidity to previously created asset pair pool.
     *
     *Shares are issued with current price.
     *
     *Emits `LiquidityAdded` event when successful.
     */
    add_liquidity: TxDescriptor<Anonymize<Ie03o0h06lol9p>>;
    /**
     *Remove liquidity from specific liquidity pool in the form of burning shares.
     *
     *If liquidity in the pool reaches 0, it is destroyed.
     *
     *Emits 'LiquidityRemoved' when successful.
     *Emits 'PoolDestroyed' when pool is destroyed.
     */
    remove_liquidity: TxDescriptor<Anonymize<Ie6ot1bq9o2jef>>;
    /**
     *Trade asset in for asset out.
     *
     *Executes a swap of `asset_in` for `asset_out`. Price is determined by the liquidity pool.
     *
     *`max_limit` - minimum amount of `asset_out` / amount of asset_out to be obtained from the pool in exchange for `asset_in`.
     *
     *Emits `SellExecuted` when successful. Deprecated.
     *Emits `pallet_broadcast::Swapped` when successful.
     */
    sell: TxDescriptor<Anonymize<I6ap0qjh5n5817>>;
    /**
     *Trade asset in for asset out.
     *
     *Executes a swap of `asset_in` for `asset_out`. Price is determined by the liquidity pool.
     *
     *`max_limit` - maximum amount of `asset_in` to be sold in exchange for `asset_out`.
     *Emits `BuyExecuted` when successful. Deprecated.
     *Emits `pallet_broadcast::Swapped` when successful.
     */
    buy: TxDescriptor<Anonymize<I6ap0qjh5n5817>>;
  };
  Referrals: {
    /**
     *Register new referral code.
     *
     *`origin` pays the registration fee.
     *`code` is assigned to the given `account`.
     *
     *Length of the `code` must be at least `T::MinCodeLength`.
     *Maximum length is limited to `T::CodeLength`.
     *`code` must contain only alfa-numeric characters and all characters will be converted to upper case.
     *
     *Parameters:
     *- `code`: Code to register. Must follow the restrictions.
     *
     *Emits `CodeRegistered` event when successful.
     */
    register_code: TxDescriptor<Anonymize<I6pjjpfvhvcfru>>;
    /**
     *Link a code to an account.
     *
     *`Code` must be valid registered code. Otherwise `InvalidCode` is returned.
     *
     *Signer account is linked to the referral account of the code.
     *
     *Parameters:
     *- `code`: Code to use to link the signer account to.
     *
     *Emits `CodeLinked` event when successful.
     */
    link_code: TxDescriptor<Anonymize<I6pjjpfvhvcfru>>;
    /**
     *Convert accrued asset amount to reward currency.
     *
     *Parameters:
     *- `asset_id`: Id of an asset to convert to RewardAsset.
     *
     *Emits `Converted` event when successful.
     */
    convert: TxDescriptor<Anonymize<Ia5le7udkgbaq9>>;
    /**
     *Claim accumulated rewards
     *
     *IF there is any asset in the reward pot, all is converted to RewardCurrency first.
     *
     *Reward amount is calculated based on the shares of the signer account.
     *
     *if the signer account is referrer account, total accumulated rewards is updated as well as referrer level if reached.
     *
     *Emits `Claimed` event when successful.
     */
    claim_rewards: TxDescriptor<undefined>;
    /**
     *Set asset reward percentages
     *
     *Parameters:
     *- `asset_id`: asset id
     *- `level`: level
     *- `rewards`: reward fee percentages
     *
     *Emits `AssetRewardsUpdated` event when successful.
     */
    set_reward_percentage: TxDescriptor<Anonymize<Ionfhf9va2t31>>;
  };
  Liquidation: {
    /**
     *Liquidates an existing money market position.
     *
     *Performs a flash loan to get funds to pay for the debt.
     *Received collateral is swapped and the profit is transferred to `FeeReceiver`.
     *
     *Parameters:
     *- `origin`: Signed origin.
     *- `collateral_asset`: Asset ID used as collateral in the MM position.
     *- `debt_asset`: Asset ID used as debt in the MM position.
     *- `user`: EVM address of the MM position that we want to liquidate.
     *- `debt_to_cover`: Amount of debt we want to liquidate.
     *- `route`: The route we trade against. Required for the fee calculation.
     *
     *Emits `Liquidated` event when successful.
     *
     */
    liquidate: TxDescriptor<Anonymize<I2j52g067ah8dm>>;
    /**
     *Set the borrowing market contract address.
     */
    set_borrowing_contract: TxDescriptor<Anonymize<Ics51ctc9oasbt>>;
  };
  Tokens: {
    /**
     *Transfer some liquid free balance to another account.
     *
     *`transfer` will set the `FreeBalance` of the sender and receiver.
     *It will decrease the total issuance of the system by the
     *`TransferFee`. If the sender's account is below the existential
     *deposit as a result of the transfer, the account will be reaped.
     *
     *The dispatch origin for this call must be `Signed` by the
     *transactor.
     *
     *- `dest`: The recipient of the transfer.
     *- `currency_id`: currency type.
     *- `amount`: free balance amount to tranfer.
     */
    transfer: TxDescriptor<Anonymize<Ibbvcet1pv1l61>>;
    /**
     *Transfer all remaining balance to the given account.
     *
     *NOTE: This function only attempts to transfer _transferable_
     *balances. This means that any locked, reserved, or existential
     *deposits (when `keep_alive` is `true`), will not be transferred by
     *this function. To ensure that this function results in a killed
     *account, you might need to prepare the account by removing any
     *reference counters, storage deposits, etc...
     *
     *The dispatch origin for this call must be `Signed` by the
     *transactor.
     *
     *- `dest`: The recipient of the transfer.
     *- `currency_id`: currency type.
     *- `keep_alive`: A boolean to determine if the `transfer_all`
     *  operation should send all of the funds the account has, causing
     *  the sender account to be killed (false), or transfer everything
     *  except at least the existential deposit, which will guarantee to
     *  keep the sender account alive (true).
     */
    transfer_all: TxDescriptor<Anonymize<I67bpqa7o2ocua>>;
    /**
     *Same as the [`transfer`] call, but with a check that the transfer
     *will not kill the origin account.
     *
     *99% of the time you want [`transfer`] instead.
     *
     *The dispatch origin for this call must be `Signed` by the
     *transactor.
     *
     *- `dest`: The recipient of the transfer.
     *- `currency_id`: currency type.
     *- `amount`: free balance amount to tranfer.
     */
    transfer_keep_alive: TxDescriptor<Anonymize<Ibbvcet1pv1l61>>;
    /**
     *Exactly as `transfer`, except the origin must be root and the source
     *account may be specified.
     *
     *The dispatch origin for this call must be _Root_.
     *
     *- `source`: The sender of the transfer.
     *- `dest`: The recipient of the transfer.
     *- `currency_id`: currency type.
     *- `amount`: free balance amount to tranfer.
     */
    force_transfer: TxDescriptor<Anonymize<I2holodggoluon>>;
    /**
     *Set the balances of a given account.
     *
     *This will alter `FreeBalance` and `ReservedBalance` in storage. it
     *will also decrease the total issuance of the system
     *(`TotalIssuance`). If the new free or reserved balance is below the
     *existential deposit, it will reap the `AccountInfo`.
     *
     *The dispatch origin for this call is `root`.
     */
    set_balance: TxDescriptor<Anonymize<Ib5umq5uf644jr>>;
  };
  Currencies: {
    /**
     *Transfer some balance to another account under `currency_id`.
     *
     *The dispatch origin for this call must be `Signed` by the
     *transactor.
     */
    transfer: TxDescriptor<Anonymize<Ibbvcet1pv1l61>>;
    /**
     *Transfer some native currency to another account.
     *
     *The dispatch origin for this call must be `Signed` by the
     *transactor.
     */
    transfer_native_currency: TxDescriptor<Anonymize<I9r83fr4b3rmmj>>;
    /**
     *update amount of account `who` under `currency_id`.
     *
     *The dispatch origin of this call must be _Root_.
     */
    update_balance: TxDescriptor<Anonymize<I24s4g6gkj5oec>>;
  };
  Vesting: {
    /**
        
         */
    claim: TxDescriptor<undefined>;
    /**
        
         */
    vested_transfer: TxDescriptor<Anonymize<Iapqe6jot9df6>>;
    /**
        
         */
    update_vesting_schedules: TxDescriptor<Anonymize<If64i3fucaastf>>;
    /**
        
         */
    claim_for: TxDescriptor<Anonymize<Ietluscr05n0a8>>;
  };
  EVM: {
    /**
     *Withdraw balance from EVM into currency/balances pallet.
     */
    withdraw: TxDescriptor<Anonymize<Idcabvplu05lea>>;
    /**
     *Issue an EVM call operation. This is similar to a message call transaction in Ethereum.
     */
    call: TxDescriptor<Anonymize<I2ncccle6pmhd9>>;
    /**
     *Issue an EVM create operation. This is similar to a contract creation transaction in
     *Ethereum.
     */
    create: TxDescriptor<Anonymize<I92bnd3pe0civj>>;
    /**
     *Issue an EVM create2 operation.
     */
    create2: TxDescriptor<Anonymize<Ic84i538n8bl8j>>;
  };
  Ethereum: {
    /**
     *Transact an Ethereum transaction.
     */
    transact: TxDescriptor<Anonymize<Ia8ogbeici6lip>>;
  };
  EVMAccounts: {
    /**
     *Binds a Substrate address to EVM address.
     *After binding, the EVM is able to convert an EVM address to the original Substrate address.
     *Without binding, the EVM converts an EVM address to a truncated Substrate address, which doesn't correspond
     *to the origin address.
     *
     *Binding an address is not necessary for interacting with the EVM.
     *
     *Parameters:
     *- `origin`: Substrate account binding an address
     *
     *Emits `EvmAccountBound` event when successful.
     */
    bind_evm_address: TxDescriptor<undefined>;
    /**
     *Adds an EVM address to the list of addresses that are allowed to deploy smart contracts.
     *
     *Parameters:
     *- `origin`: Substrate account whitelisting an address. Must be `ControllerOrigin`.
     *- `address`: EVM address that is whitelisted
     *
     *Emits `DeployerAdded` event when successful.
     */
    add_contract_deployer: TxDescriptor<Anonymize<Itmchvgqfl28g>>;
    /**
     *Removes an EVM address from the list of addresses that are allowed to deploy smart contracts.
     *
     *Parameters:
     *- `origin`: Substrate account removing the EVM address from the whitelist. Must be `ControllerOrigin`.
     *- `address`: EVM address that is removed from the whitelist
     *
     *Emits `DeployerRemoved` event when successful.
     */
    remove_contract_deployer: TxDescriptor<Anonymize<Itmchvgqfl28g>>;
    /**
     *Removes the account's EVM address from the list of addresses that are allowed to deploy smart contracts.
     *Based on the best practices, this extrinsic can be called by any whitelisted account to renounce their own permission.
     *
     *Parameters:
     *- `origin`: Substrate account removing their EVM address from the whitelist.
     *
     *Emits `DeployerRemoved` event when successful.
     */
    renounce_contract_deployer: TxDescriptor<undefined>;
    /**
     *Adds address of the contract to the list of approved contracts to manage balances.
     *
     *Effectively giving it allowance to for any balances and tokens.
     *
     *Parameters:
     *- `origin`:  Must be `ControllerOrigin`.
     *- `address`: Contract address that will be approved
     *
     *Emits `ContractApproved` event when successful.
     */
    approve_contract: TxDescriptor<Anonymize<Itmchvgqfl28g>>;
    /**
     *Removes address of the contract from the list of approved contracts to manage balances.
     *
     *Parameters:
     *- `origin`:  Must be `ControllerOrigin`.
     *- `address`: Contract address that will be disapproved
     *
     *Emits `ContractDisapproved` event when successful.
     */
    disapprove_contract: TxDescriptor<Anonymize<Itmchvgqfl28g>>;
  };
  XYKLiquidityMining: {
    /**
     *Create new liquidity mining program with provided parameters.
     *
     *`owner` account has to have at least `total_rewards` balance. This fund will be
     *transferred from `owner` to farm account.
     *In case of `reward_currency` is insufficient asset, farm's `owner` has to pay existential
     *deposit for global farm account and for liquidity mining `pot` account.
     *
     *The dispatch origin for this call must be `T::CreateOrigin`.
     *!!!WARN: `T::CreateOrigin` has power over funds of `owner`'s account and it should be
     *configured to trusted origin e.g Sudo or Governance.
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `total_rewards`: total rewards planned to distribute. This rewards will be
     *distributed between all yield farms in the global farm.
     *- `planned_yielding_periods`: planned number of periods to distribute `total_rewards`.
     *WARN: THIS IS NOT HARD DEADLINE. Not all rewards have to be distributed in
     *`planned_yielding_periods`. Rewards are distributed based on the situation in the yield
     *farms and can be distributed in a longer time frame but never in the shorter time frame.
     *- `blocks_per_period`:  number of blocks in a single period. Min. number of blocks per
     *period is 1.
     *- `incentivized_asset`: asset to be incentivized in XYK pools. All yield farms added into
     *liq. mining program have to have `incentivized_asset` in their pair.
     *- `reward_currency`: payoff currency of rewards.
     *- `owner`: liq. mining program owner.
     *- `yield_per_period`: percentage return on `reward_currency` of all farms p.a.
     *- `min_deposit`: minimum amount which can be deposited to the farm
     *- `price_adjustment`:
     *Emits `GlobalFarmCreated` event when successful.
     */
    create_global_farm: TxDescriptor<Anonymize<I10hmgseei3j6r>>;
    /**
     *Update global farm's prices adjustment.
     *
     *Only farm's owner can perform this action.
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `global_farm_id`: id of the global farm to update
     *- `price_adjustment`: new value for price adjustment
     *
     *Emits `GlobalFarmUpdated` event when successful.
     */
    update_global_farm: TxDescriptor<Anonymize<I8p4numg1r4ojm>>;
    /**
     *Terminate existing liq. mining program.
     *
     *Only farm owner can perform this action.
     *
     *WARN: To successfully terminate a farm, farm have to be empty(all yield farms in he global farm must be terminated).
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `global_farm_id`: id of global farm to be terminated.
     *
     *Emits `GlobalFarmTerminated` event when successful.
     */
    terminate_global_farm: TxDescriptor<Anonymize<I9q8qmop6bko5m>>;
    /**
     *Add yield farm for given `asset_pair` XYK pool.
     *
     *Only farm owner can perform this action.
     *
     *Only XYKs with `asset_pair` with `incentivized_asset` can be added into the farm. XYK
     *pool for `asset_pair` has to exist to successfully create yield farm.
     *Yield farm for same `asset_pair` can exist only once in the global farm.
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `farm_id`: global farm id to which a yield farm will be added.
     *- `asset_pair`: asset pair identifying yield farm. Liq. mining will be allowed for this
     *`asset_pair` and one of the assets in the pair must be `incentivized_asset`.
     *- `multiplier`: yield farm multiplier.
     *- `loyalty_curve`: curve to calculate loyalty multiplier to distribute rewards to users
     *with time incentive. `None` means no loyalty multiplier.
     *
     *Emits `YieldFarmCreated` event when successful.
     */
    create_yield_farm: TxDescriptor<Anonymize<Idtucog650c7f8>>;
    /**
     *Update yield farm multiplier.
     *
     *Only farm owner can perform this action.
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `global_farm_id`: global farm id in which yield farm will be updated.
     *- `asset_pair`: asset pair identifying yield farm in global farm.
     *- `multiplier`: new yield farm multiplier.
     *
     *Emits `YieldFarmUpdated` event when successful.
     */
    update_yield_farm: TxDescriptor<Anonymize<I4kvfua9fqrpi2>>;
    /**
     *Stop liq. miming for specific yield farm.
     *
     *This function claims rewards from `GlobalFarm` last time and stops yield farm
     *incentivization from a `GlobalFarm`. Users will be able to only withdraw
     *shares(with claiming) after calling this function.
     *`deposit_shares()` and `claim_rewards()` are not allowed on canceled yield farm.
     *
     *Only farm owner can perform this action.
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `global_farm_id`: farm id in which yield farm will be canceled.
     *- `asset_pair`: asset pair identifying yield farm in the farm.
     *
     *Emits `YieldFarmStopped` event when successful.
     */
    stop_yield_farm: TxDescriptor<Anonymize<I7t5blhj97u8r7>>;
    /**
     *Resume yield farm for stopped yield farm.
     *
     *This function resume incentivization from `GlobalFarm` and restore full functionality
     *for yield farm. Users will be able to deposit, claim and withdraw again.
     *
     *WARN: Yield farm is NOT rewarded for time it was stopped.
     *
     *Only farm owner can perform this action.
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `global_farm_id`: global farm id in which yield farm will be resumed.
     *- `yield_farm_id`: id of yield farm to be resumed.
     *- `asset_pair`: asset pair identifying yield farm in global farm.
     *- `multiplier`: yield farm multiplier in the farm.
     *
     *Emits `YieldFarmResumed` event when successful.
     */
    resume_yield_farm: TxDescriptor<Anonymize<I21qpgggberqt3>>;
    /**
     *Remove yield farm
     *
     *This function marks a yield farm as ready to be removed from storage when it's empty. Users will
     *be able to only withdraw shares(without claiming rewards from yield farm). Unpaid rewards
     *will be transferred back to global farm and will be used to distribute to other yield farms.
     *
     *Yield farm must be stopped before calling this function.
     *
     *Only global farm's owner can perform this action. Yield farm stays in the storage until it's
     *empty(all farm entries are withdrawn). Last withdrawn from yield farm trigger removing from
     *the storage.
     *
     *Parameters:
     *- `origin`: global farm's owner.
     *- `global_farm_id`: farm id from which yield farm should be terminated.
     *- `yield_farm_id`: id of yield farm to be terminated.
     *- `asset_pair`: asset pair identifying yield farm in the global farm.
     *
     *Emits `YieldFarmTerminated` event when successful.
     */
    terminate_yield_farm: TxDescriptor<Anonymize<Id7r4m9aulb7sn>>;
    /**
     *Deposit LP shares to a liq. mining.
     *
     *This function transfers LP shares from `origin` to pallet's account and mint nft for
     *`origin` account. Minted nft represents deposit in the liq. mining.
     *
     *Parameters:
     *- `origin`: account depositing LP shares. This account has to have at least
     *`shares_amount` of LP shares.
     *- `global_farm_id`: id of global farm to which user wants to deposit LP shares.
     *- `yield_farm_id`: id of yield farm to deposit to.
     *- `asset_pair`: asset pair identifying LP shares user wants to deposit.
     *- `shares_amount`: amount of LP shares user wants to deposit.
     *
     *Emits `SharesDeposited` event when successful.
     */
    deposit_shares: TxDescriptor<Anonymize<Ielqbuofrsq2ri>>;
    /**
     *Join multiple farms with a given share amount
     *
     *The share is deposited to the first farm of the specified fams,
     *and then redeposit the shares to the remaining farms
     *
     *Parameters:
     *- `origin`: account depositing LP shares. This account has to have at least
     *- `farm_entries`: list of global farm id and yield farm id pairs to join
     *- `asset_pair`: asset pair identifying LP shares user wants to deposit.
     *- `shares_amount`: amount of LP shares user wants to deposit.
     *
     *Emits `SharesDeposited` event for the first farm entry
     *Emits `SharesRedeposited` event for each farm entry after the first one
     */
    join_farms: TxDescriptor<Anonymize<I3hno1r9147mro>>;
    /**
     *Add liquidity to XYK pool and join multiple farms with a given share amount
     *
     *The share is deposited to the first farm of the specified entries,
     *and then redeposit the shares to the remaining farms
     *
     *Parameters:
     *- `origin`: account depositing LP shares. This account has to have at least
     *- `asset_a`: asset id of the first asset in the pair
     *- `asset_b`: asset id of the second asset in the pair
     *- `amount_a`: amount of the first asset to deposit
     *- `amount_b_max_limit`: maximum amount of the second asset to deposit
     *- `farm_entries`: list of global farm id and yield farm id pairs to join
     *
     *Emits `SharesDeposited` event for the first farm entry
     *Emits `SharesRedeposited` event for each farm entry after the first one
     */
    add_liquidity_and_join_farms: TxDescriptor<Anonymize<Iaihikf7d0fpt7>>;
    /**
     *Redeposit already locked LP shares to another yield farm.
     *
     *This function create yield farm entry for existing deposit. LP shares are not transferred
     *and amount of LP shares is based on existing deposit.
     *
     *This function DOESN'T create new deposit.
     *
     *Parameters:
     *- `origin`: account depositing LP shares. This account have to have at least
     *- `global_farm_id`: global farm identifier.
     *- `yield_farm_id`: yield farm identifier redepositing to.
     *- `asset_pair`: asset pair identifying LP shares user want to deposit.
     *- `deposit_id`: identifier of the deposit.
     *
     *Emits `SharesRedeposited` event when successful.
     */
    redeposit_shares: TxDescriptor<Anonymize<Iaehj4ajaudum7>>;
    /**
     *Claim rewards from liq. mining for deposit represented by `nft_id`.
     *
     *This function calculate user rewards from liq. mining and transfer rewards to `origin`
     *account. Claiming in the same period is allowed only once.
     *
     *Parameters:
     *- `origin`: account owner of deposit(nft).
     *- `deposit_id`: nft id representing deposit in the yield farm.
     *- `yield_farm_id`: yield farm identifier to claim rewards from.
     *
     *Emits `RewardClaimed` event when successful.
     */
    claim_rewards: TxDescriptor<Anonymize<I2k37dcoppgins>>;
    /**
     *Withdraw LP shares from liq. mining with reward claiming if possible.
     *
     *List of possible cases of transfers of LP shares and claimed rewards:
     *
     ** yield farm is active(yield farm is not stopped) - claim and transfer rewards(if it
     *wasn't claimed in this period) and transfer LP shares.
     ** liq. mining is stopped - claim and transfer rewards(if it
     *wasn't claimed in this period) and transfer LP shares.
     ** yield farm was terminated - only LP shares will be transferred.
     ** farm was terminated - only LP shares will be transferred.
     *
     *User's unclaimable rewards will be transferred back to global farm's account.
     *
     *Parameters:
     *- `origin`: account owner of deposit(nft).
     *- `deposit_id`: nft id representing deposit in the yield farm.
     *- `yield_farm_id`: yield farm identifier to dithdraw shares from.
     *- `asset_pair`: asset pair identifying yield farm in global farm.
     *
     *Emits:
     ** `RewardClaimed` if claim happen
     ** `SharesWithdrawn` event when successful
     */
    withdraw_shares: TxDescriptor<Anonymize<Id83ilm95if0sl>>;
    /**
     *Exit from all specified yield farms
     *
     *This function will attempt to withdraw shares and claim rewards (if available) from all
     *specified yield farms for a given deposit.
     *
     *Parameters:
     *- `origin`: account owner of deposit(nft).
     *- `deposit_id`: nft id representing deposit in the yield farm.
     *- `asset_pair`: asset pair identifying yield farm(s) in global farm(s).
     *- `farm_entries`: id(s) of yield farm(s) to exit from.
     *
     *Emits:
     ** `RewardClaimed` for each successful claim
     ** `SharesWithdrawn` for each successful withdrawal
     ** `DepositDestroyed` if the deposit is fully withdrawn
     *
     */
    exit_farms: TxDescriptor<Anonymize<I82r4tvnf2s05i>>;
  };
  DCA: {
    /**
     *Creates a new DCA (Dollar-Cost Averaging) schedule and plans the next execution
     *for the specified block.
     *
     *If the block is not specified, the execution is planned for the next block.
     *If the given block is full, the execution will be planned in the subsequent block.
     *
     *Once the schedule is created, the specified `total_amount` will be reserved for DCA.
     *The reservation currency will be the `amount_in` currency of the order.
     *
     *Trades are executed as long as there is budget remaining
     *from the initial `total_amount` allocation, unless `total_amount` is 0, then trades
     *are executed until schedule is terminated.
     *
     *If a trade fails due to slippage limit or price stability errors, it will be retried.
     *If the number of retries reaches the maximum allowed,
     *the schedule will be terminated permanently.
     *In the case of a successful trade, the retry counter is reset.
     *
     *Parameters:
     *- `origin`: schedule owner
     *- `schedule`: schedule details
     *- `start_execution_block`: first possible execution block for the schedule
     *
     *Emits `Scheduled` and `ExecutionPlanned` event when successful.
     *
     */
    schedule: TxDescriptor<Anonymize<Ico8a80unk7v19>>;
    /**
     *Terminates a DCA schedule and remove it completely from the chain.
     *
     *This can be called by both schedule owner or the configured `T::TerminateOrigin`
     *
     *Parameters:
     *- `origin`: schedule owner
     *- `schedule_id`: schedule id
     *- `next_execution_block`: block number where the schedule is planned.
     *
     *Emits `Terminated` event when successful.
     *
     */
    terminate: TxDescriptor<Anonymize<Ib9aiguc778ujf>>;
  };
  Scheduler: {
    /**
     *Anonymously schedule a task.
     */
    schedule: TxDescriptor<Anonymize<Ib7m93b836tdpq>>;
    /**
     *Cancel an anonymously scheduled task.
     */
    cancel: TxDescriptor<Anonymize<I5n4sebgkfr760>>;
    /**
     *Schedule a named task.
     */
    schedule_named: TxDescriptor<Anonymize<Iavvprr56ai2oq>>;
    /**
     *Cancel a named scheduled task.
     */
    cancel_named: TxDescriptor<Anonymize<Ifs1i5fk9cqvr6>>;
    /**
     *Anonymously schedule a task after a delay.
     */
    schedule_after: TxDescriptor<Anonymize<I7t5t1pb9tm22k>>;
    /**
     *Schedule a named task after a delay.
     */
    schedule_named_after: TxDescriptor<Anonymize<I8ecgqolcgg12u>>;
    /**
     *Set a retry configuration for a task so that, in case its scheduled run fails, it will
     *be retried after `period` blocks, for a total amount of `retries` retries or until it
     *succeeds.
     *
     *Tasks which need to be scheduled for a retry are still subject to weight metering and
     *agenda space, same as a regular task. If a periodic task fails, it will be scheduled
     *normally while the task is retrying.
     *
     *Tasks scheduled as a result of a retry for a periodic task are unnamed, non-periodic
     *clones of the original task. Their retry configuration will be derived from the
     *original task's configuration, but will have a lower value for `remaining` than the
     *original `total_retries`.
     */
    set_retry: TxDescriptor<Anonymize<Ieg3fd8p4pkt10>>;
    /**
     *Set a retry configuration for a named task so that, in case its scheduled run fails, it
     *will be retried after `period` blocks, for a total amount of `retries` retries or until
     *it succeeds.
     *
     *Tasks which need to be scheduled for a retry are still subject to weight metering and
     *agenda space, same as a regular task. If a periodic task fails, it will be scheduled
     *normally while the task is retrying.
     *
     *Tasks scheduled as a result of a retry for a periodic task are unnamed, non-periodic
     *clones of the original task. Their retry configuration will be derived from the
     *original task's configuration, but will have a lower value for `remaining` than the
     *original `total_retries`.
     */
    set_retry_named: TxDescriptor<Anonymize<I8kg5ll427kfqq>>;
    /**
     *Removes the retry configuration of a task.
     */
    cancel_retry: TxDescriptor<Anonymize<I467333262q1l9>>;
    /**
     *Cancel the retry configuration of a named task.
     */
    cancel_retry_named: TxDescriptor<Anonymize<Ifs1i5fk9cqvr6>>;
  };
  ParachainSystem: {
    /**
     *Set the current validation data.
     *
     *This should be invoked exactly once per block. It will panic at the finalization
     *phase if the call was not invoked.
     *
     *The dispatch origin for this call must be `Inherent`
     *
     *As a side effect, this function upgrades the current validation function
     *if the appropriate time has come.
     */
    set_validation_data: TxDescriptor<Anonymize<I60v7bikk54tpu>>;
    /**
        
         */
    sudo_send_upward_message: TxDescriptor<Anonymize<Ifpj261e8s63m3>>;
    /**
     *Authorize an upgrade to a given `code_hash` for the runtime. The runtime can be supplied
     *later.
     *
     *The `check_version` parameter sets a boolean flag for whether or not the runtime's spec
     *version and name should be verified on upgrade. Since the authorization only has a hash,
     *it cannot actually perform the verification.
     *
     *This call requires Root origin.
     */
    authorize_upgrade: TxDescriptor<Anonymize<Ibgl04rn6nbfm6>>;
    /**
     *Provide the preimage (runtime binary) `code` for an upgrade that has been authorized.
     *
     *If the authorization required a version check, this call will ensure the spec name
     *remains unchanged and that the spec version has increased.
     *
     *Note that this function will not apply the new `code`, but only attempt to schedule the
     *upgrade with the Relay Chain.
     *
     *All origins are allowed.
     */
    enact_authorized_upgrade: TxDescriptor<Anonymize<I6pjjpfvhvcfru>>;
  };
  PolkadotXcm: {
    /**
        
         */
    send: TxDescriptor<Anonymize<I9paqujeb1fpv6>>;
    /**
     *Teleport some assets from the local chain to some destination chain.
     *
     ***This function is deprecated: Use `limited_teleport_assets` instead.**
     *
     *Fee payment on the destination side is made from the asset in the `assets` vector of
     *index `fee_asset_item`. The weight limit for fees is not provided and thus is unlimited,
     *with all fees taken as needed from the asset.
     *
     *- `origin`: Must be capable of withdrawing the `assets` and executing XCM.
     *- `dest`: Destination context for the assets. Will typically be `[Parent,
     *  Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
     *  relay to parachain.
     *- `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
     *  generally be an `AccountId32` value.
     *- `assets`: The assets to be withdrawn. This should include the assets used to pay the
     *  fee on the `dest` chain.
     *- `fee_asset_item`: The index into `assets` of the item which should be used to pay
     *  fees.
     */
    teleport_assets: TxDescriptor<Anonymize<Iakevv83i18n4r>>;
    /**
     *Transfer some assets from the local chain to the destination chain through their local,
     *destination or remote reserve.
     *
     *`assets` must have same reserve location and may not be teleportable to `dest`.
     * - `assets` have local reserve: transfer assets to sovereign account of destination
     *   chain and forward a notification XCM to `dest` to mint and deposit reserve-based
     *   assets to `beneficiary`.
     * - `assets` have destination reserve: burn local assets and forward a notification to
     *   `dest` chain to withdraw the reserve assets from this chain's sovereign account and
     *   deposit them to `beneficiary`.
     * - `assets` have remote reserve: burn local assets, forward XCM to reserve chain to move
     *   reserves from this chain's SA to `dest` chain's SA, and forward another XCM to `dest`
     *   to mint and deposit reserve-based assets to `beneficiary`.
     *
     ***This function is deprecated: Use `limited_reserve_transfer_assets` instead.**
     *
     *Fee payment on the destination side is made from the asset in the `assets` vector of
     *index `fee_asset_item`. The weight limit for fees is not provided and thus is unlimited,
     *with all fees taken as needed from the asset.
     *
     *- `origin`: Must be capable of withdrawing the `assets` and executing XCM.
     *- `dest`: Destination context for the assets. Will typically be `[Parent,
     *  Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
     *  relay to parachain.
     *- `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
     *  generally be an `AccountId32` value.
     *- `assets`: The assets to be withdrawn. This should include the assets used to pay the
     *  fee on the `dest` (and possibly reserve) chains.
     *- `fee_asset_item`: The index into `assets` of the item which should be used to pay
     *  fees.
     */
    reserve_transfer_assets: TxDescriptor<Anonymize<Iakevv83i18n4r>>;
    /**
     *Execute an XCM message from a local, signed, origin.
     *
     *An event is deposited indicating whether `msg` could be executed completely or only
     *partially.
     *
     *No more than `max_weight` will be used in its attempted execution. If this is less than
     *the maximum amount of weight that the message could take to be executed, then no
     *execution attempt will be made.
     */
    execute: TxDescriptor<Anonymize<If2ssl12kcglhg>>;
    /**
     *Extoll that a particular destination can be communicated with through a particular
     *version of XCM.
     *
     *- `origin`: Must be an origin specified by AdminOrigin.
     *- `location`: The destination that is being described.
     *- `xcm_version`: The latest version of XCM that `location` supports.
     */
    force_xcm_version: TxDescriptor<Anonymize<Iabk8ljl5g8c86>>;
    /**
     *Set a safe XCM version (the version that XCM should be encoded with if the most recent
     *version a destination can accept is unknown).
     *
     *- `origin`: Must be an origin specified by AdminOrigin.
     *- `maybe_xcm_version`: The default XCM encoding version, or `None` to disable.
     */
    force_default_xcm_version: TxDescriptor<Anonymize<Ic76kfh5ebqkpl>>;
    /**
     *Ask a location to notify us regarding their XCM version and any changes to it.
     *
     *- `origin`: Must be an origin specified by AdminOrigin.
     *- `location`: The location to which we should subscribe for XCM version notifications.
     */
    force_subscribe_version_notify: TxDescriptor<Anonymize<Icrujen33bbibf>>;
    /**
     *Require that a particular destination should no longer notify us regarding any XCM
     *version changes.
     *
     *- `origin`: Must be an origin specified by AdminOrigin.
     *- `location`: The location to which we are currently subscribed for XCM version
     *  notifications which we no longer desire.
     */
    force_unsubscribe_version_notify: TxDescriptor<Anonymize<Icrujen33bbibf>>;
    /**
     *Transfer some assets from the local chain to the destination chain through their local,
     *destination or remote reserve.
     *
     *`assets` must have same reserve location and may not be teleportable to `dest`.
     * - `assets` have local reserve: transfer assets to sovereign account of destination
     *   chain and forward a notification XCM to `dest` to mint and deposit reserve-based
     *   assets to `beneficiary`.
     * - `assets` have destination reserve: burn local assets and forward a notification to
     *   `dest` chain to withdraw the reserve assets from this chain's sovereign account and
     *   deposit them to `beneficiary`.
     * - `assets` have remote reserve: burn local assets, forward XCM to reserve chain to move
     *   reserves from this chain's SA to `dest` chain's SA, and forward another XCM to `dest`
     *   to mint and deposit reserve-based assets to `beneficiary`.
     *
     *Fee payment on the destination side is made from the asset in the `assets` vector of
     *index `fee_asset_item`, up to enough to pay for `weight_limit` of weight. If more weight
     *is needed than `weight_limit`, then the operation will fail and the sent assets may be
     *at risk.
     *
     *- `origin`: Must be capable of withdrawing the `assets` and executing XCM.
     *- `dest`: Destination context for the assets. Will typically be `[Parent,
     *  Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
     *  relay to parachain.
     *- `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
     *  generally be an `AccountId32` value.
     *- `assets`: The assets to be withdrawn. This should include the assets used to pay the
     *  fee on the `dest` (and possibly reserve) chains.
     *- `fee_asset_item`: The index into `assets` of the item which should be used to pay
     *  fees.
     *- `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
     */
    limited_reserve_transfer_assets: TxDescriptor<Anonymize<I5gi8h3e5lkbeq>>;
    /**
     *Teleport some assets from the local chain to some destination chain.
     *
     *Fee payment on the destination side is made from the asset in the `assets` vector of
     *index `fee_asset_item`, up to enough to pay for `weight_limit` of weight. If more weight
     *is needed than `weight_limit`, then the operation will fail and the sent assets may be
     *at risk.
     *
     *- `origin`: Must be capable of withdrawing the `assets` and executing XCM.
     *- `dest`: Destination context for the assets. Will typically be `[Parent,
     *  Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
     *  relay to parachain.
     *- `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
     *  generally be an `AccountId32` value.
     *- `assets`: The assets to be withdrawn. This should include the assets used to pay the
     *  fee on the `dest` chain.
     *- `fee_asset_item`: The index into `assets` of the item which should be used to pay
     *  fees.
     *- `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
     */
    limited_teleport_assets: TxDescriptor<Anonymize<I5gi8h3e5lkbeq>>;
    /**
     *Set or unset the global suspension state of the XCM executor.
     *
     *- `origin`: Must be an origin specified by AdminOrigin.
     *- `suspended`: `true` to suspend, `false` to resume.
     */
    force_suspension: TxDescriptor<Anonymize<Ibgm4rnf22lal1>>;
    /**
     *Transfer some assets from the local chain to the destination chain through their local,
     *destination or remote reserve, or through teleports.
     *
     *Fee payment on the destination side is made from the asset in the `assets` vector of
     *index `fee_asset_item` (hence referred to as `fees`), up to enough to pay for
     *`weight_limit` of weight. If more weight is needed than `weight_limit`, then the
     *operation will fail and the sent assets may be at risk.
     *
     *`assets` (excluding `fees`) must have same reserve location or otherwise be teleportable
     *to `dest`, no limitations imposed on `fees`.
     * - for local reserve: transfer assets to sovereign account of destination chain and
     *   forward a notification XCM to `dest` to mint and deposit reserve-based assets to
     *   `beneficiary`.
     * - for destination reserve: burn local assets and forward a notification to `dest` chain
     *   to withdraw the reserve assets from this chain's sovereign account and deposit them
     *   to `beneficiary`.
     * - for remote reserve: burn local assets, forward XCM to reserve chain to move reserves
     *   from this chain's SA to `dest` chain's SA, and forward another XCM to `dest` to mint
     *   and deposit reserve-based assets to `beneficiary`.
     * - for teleports: burn local assets and forward XCM to `dest` chain to mint/teleport
     *   assets and deposit them to `beneficiary`.
     *
     *- `origin`: Must be capable of withdrawing the `assets` and executing XCM.
     *- `dest`: Destination context for the assets. Will typically be `X2(Parent,
     *  Parachain(..))` to send from parachain to parachain, or `X1(Parachain(..))` to send
     *  from relay to parachain.
     *- `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
     *  generally be an `AccountId32` value.
     *- `assets`: The assets to be withdrawn. This should include the assets used to pay the
     *  fee on the `dest` (and possibly reserve) chains.
     *- `fee_asset_item`: The index into `assets` of the item which should be used to pay
     *  fees.
     *- `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
     */
    transfer_assets: TxDescriptor<Anonymize<I5gi8h3e5lkbeq>>;
    /**
     *Claims assets trapped on this pallet because of leftover assets during XCM execution.
     *
     *- `origin`: Anyone can call this extrinsic.
     *- `assets`: The exact assets that were trapped. Use the version to specify what version
     *was the latest when they were trapped.
     *- `beneficiary`: The location/account where the claimed assets will be deposited.
     */
    claim_assets: TxDescriptor<Anonymize<I8mmaab8je28oo>>;
    /**
     *Transfer assets from the local chain to the destination chain using explicit transfer
     *types for assets and fees.
     *
     *`assets` must have same reserve location or may be teleportable to `dest`. Caller must
     *provide the `assets_transfer_type` to be used for `assets`:
     * - `TransferType::LocalReserve`: transfer assets to sovereign account of destination
     *   chain and forward a notification XCM to `dest` to mint and deposit reserve-based
     *   assets to `beneficiary`.
     * - `TransferType::DestinationReserve`: burn local assets and forward a notification to
     *   `dest` chain to withdraw the reserve assets from this chain's sovereign account and
     *   deposit them to `beneficiary`.
     * - `TransferType::RemoteReserve(reserve)`: burn local assets, forward XCM to `reserve`
     *   chain to move reserves from this chain's SA to `dest` chain's SA, and forward another
     *   XCM to `dest` to mint and deposit reserve-based assets to `beneficiary`. Typically
     *   the remote `reserve` is Asset Hub.
     * - `TransferType::Teleport`: burn local assets and forward XCM to `dest` chain to
     *   mint/teleport assets and deposit them to `beneficiary`.
     *
     *On the destination chain, as well as any intermediary hops, `BuyExecution` is used to
     *buy execution using transferred `assets` identified by `remote_fees_id`.
     *Make sure enough of the specified `remote_fees_id` asset is included in the given list
     *of `assets`. `remote_fees_id` should be enough to pay for `weight_limit`. If more weight
     *is needed than `weight_limit`, then the operation will fail and the sent assets may be
     *at risk.
     *
     *`remote_fees_id` may use different transfer type than rest of `assets` and can be
     *specified through `fees_transfer_type`.
     *
     *The caller needs to specify what should happen to the transferred assets once they reach
     *the `dest` chain. This is done through the `custom_xcm_on_dest` parameter, which
     *contains the instructions to execute on `dest` as a final step.
     *  This is usually as simple as:
     *  `Xcm(vec![DepositAsset { assets: Wild(AllCounted(assets.len())), beneficiary }])`,
     *  but could be something more exotic like sending the `assets` even further.
     *
     *- `origin`: Must be capable of withdrawing the `assets` and executing XCM.
     *- `dest`: Destination context for the assets. Will typically be `[Parent,
     *  Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
     *  relay to parachain, or `(parents: 2, (GlobalConsensus(..), ..))` to send from
     *  parachain across a bridge to another ecosystem destination.
     *- `assets`: The assets to be withdrawn. This should include the assets used to pay the
     *  fee on the `dest` (and possibly reserve) chains.
     *- `assets_transfer_type`: The XCM `TransferType` used to transfer the `assets`.
     *- `remote_fees_id`: One of the included `assets` to be be used to pay fees.
     *- `fees_transfer_type`: The XCM `TransferType` used to transfer the `fees` assets.
     *- `custom_xcm_on_dest`: The XCM to be executed on `dest` chain as the last step of the
     *  transfer, which also determines what happens to the assets on the destination chain.
     *- `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
     */
    transfer_assets_using_type_and_then: TxDescriptor<
      Anonymize<I6r0pr82pbiftt>
    >;
  };
  MessageQueue: {
    /**
     *Remove a page which has no more messages remaining to be processed or is stale.
     */
    reap_page: TxDescriptor<Anonymize<I40pqum1mu8qg3>>;
    /**
     *Execute an overweight message.
     *
     *Temporary processing errors will be propagated whereas permanent errors are treated
     *as success condition.
     *
     *- `origin`: Must be `Signed`.
     *- `message_origin`: The origin from which the message to be executed arrived.
     *- `page`: The page in the queue in which the message to be executed is sitting.
     *- `index`: The index into the queue of the message to be executed.
     *- `weight_limit`: The maximum amount of weight allowed to be consumed in the execution
     *  of the message.
     *
     *Benchmark complexity considerations: O(index + weight_limit).
     */
    execute_overweight: TxDescriptor<Anonymize<I1r4c2ghbtvjuc>>;
  };
  OrmlXcm: {
    /**
     *Send an XCM message as parachain sovereign.
     */
    send_as_sovereign: TxDescriptor<Anonymize<I9paqujeb1fpv6>>;
  };
  XTokens: {
    /**
     *Transfer native currencies.
     *
     *`dest_weight_limit` is the weight for XCM execution on the dest
     *chain, and it would be charged from the transferred assets. If set
     *below requirements, the execution may fail and assets wouldn't be
     *received.
     *
     *It's a no-op if any error on local XCM execution or message sending.
     *Note sending assets out per se doesn't guarantee they would be
     *received. Receiving depends on if the XCM message could be delivered
     *by the network, and if the receiving chain would handle
     *messages correctly.
     */
    transfer: TxDescriptor<Anonymize<I6t8mv3ij8f6jn>>;
    /**
     *Transfer `Asset`.
     *
     *`dest_weight_limit` is the weight for XCM execution on the dest
     *chain, and it would be charged from the transferred assets. If set
     *below requirements, the execution may fail and assets wouldn't be
     *received.
     *
     *It's a no-op if any error on local XCM execution or message sending.
     *Note sending assets out per se doesn't guarantee they would be
     *received. Receiving depends on if the XCM message could be delivered
     *by the network, and if the receiving chain would handle
     *messages correctly.
     */
    transfer_multiasset: TxDescriptor<Anonymize<Idu1ujel33jksu>>;
    /**
     *Transfer native currencies specifying the fee and amount as
     *separate.
     *
     *`dest_weight_limit` is the weight for XCM execution on the dest
     *chain, and it would be charged from the transferred assets. If set
     *below requirements, the execution may fail and assets wouldn't be
     *received.
     *
     *`fee` is the amount to be spent to pay for execution in destination
     *chain. Both fee and amount will be subtracted form the callers
     *balance.
     *
     *If `fee` is not high enough to cover for the execution costs in the
     *destination chain, then the assets will be trapped in the
     *destination chain
     *
     *It's a no-op if any error on local XCM execution or message sending.
     *Note sending assets out per se doesn't guarantee they would be
     *received. Receiving depends on if the XCM message could be delivered
     *by the network, and if the receiving chain would handle
     *messages correctly.
     */
    transfer_with_fee: TxDescriptor<Anonymize<I1ii8c8cvda9o5>>;
    /**
     *Transfer `Asset` specifying the fee and amount as separate.
     *
     *`dest_weight_limit` is the weight for XCM execution on the dest
     *chain, and it would be charged from the transferred assets. If set
     *below requirements, the execution may fail and assets wouldn't be
     *received.
     *
     *`fee` is the Asset to be spent to pay for execution in
     *destination chain. Both fee and amount will be subtracted form the
     *callers balance For now we only accept fee and asset having the same
     *`Location` id.
     *
     *If `fee` is not high enough to cover for the execution costs in the
     *destination chain, then the assets will be trapped in the
     *destination chain
     *
     *It's a no-op if any error on local XCM execution or message sending.
     *Note sending assets out per se doesn't guarantee they would be
     *received. Receiving depends on if the XCM message could be delivered
     *by the network, and if the receiving chain would handle
     *messages correctly.
     */
    transfer_multiasset_with_fee: TxDescriptor<Anonymize<I40fog3d0qlub1>>;
    /**
     *Transfer several currencies specifying the item to be used as fee
     *
     *`dest_weight_limit` is the weight for XCM execution on the dest
     *chain, and it would be charged from the transferred assets. If set
     *below requirements, the execution may fail and assets wouldn't be
     *received.
     *
     *`fee_item` is index of the currencies tuple that we want to use for
     *payment
     *
     *It's a no-op if any error on local XCM execution or message sending.
     *Note sending assets out per se doesn't guarantee they would be
     *received. Receiving depends on if the XCM message could be delivered
     *by the network, and if the receiving chain would handle
     *messages correctly.
     */
    transfer_multicurrencies: TxDescriptor<Anonymize<Ibahh2k28pd3rl>>;
    /**
     *Transfer several `Asset` specifying the item to be used as fee
     *
     *`dest_weight_limit` is the weight for XCM execution on the dest
     *chain, and it would be charged from the transferred assets. If set
     *below requirements, the execution may fail and assets wouldn't be
     *received.
     *
     *`fee_item` is index of the Assets that we want to use for
     *payment
     *
     *It's a no-op if any error on local XCM execution or message sending.
     *Note sending assets out per se doesn't guarantee they would be
     *received. Receiving depends on if the XCM message could be delivered
     *by the network, and if the receiving chain would handle
     *messages correctly.
     */
    transfer_multiassets: TxDescriptor<Anonymize<Iaif2nhfhk9qc0>>;
  };
  CollatorSelection: {
    /**
     *Set the list of invulnerable (fixed) collators. These collators must do some
     *preparation, namely to have registered session keys.
     *
     *The call will remove any accounts that have not registered keys from the set. That is,
     *it is non-atomic; the caller accepts all `AccountId`s passed in `new` _individually_ as
     *acceptable Invulnerables, and is not proposing a _set_ of new Invulnerables.
     *
     *This call does not maintain mutual exclusivity of `Invulnerables` and `Candidates`. It
     *is recommended to use a batch of `add_invulnerable` and `remove_invulnerable` instead. A
     *`batch_all` can also be used to enforce atomicity. If any candidates are included in
     *`new`, they should be removed with `remove_invulnerable_candidate` after execution.
     *
     *Must be called by the `UpdateOrigin`.
     */
    set_invulnerables: TxDescriptor<Anonymize<Ifccifqltb5obi>>;
    /**
     *Set the ideal number of non-invulnerable collators. If lowering this number, then the
     *number of running collators could be higher than this figure. Aside from that edge case,
     *there should be no other way to have more candidates than the desired number.
     *
     *The origin for this call must be the `UpdateOrigin`.
     */
    set_desired_candidates: TxDescriptor<Anonymize<Iadtsfv699cq8b>>;
    /**
     *Set the candidacy bond amount.
     *
     *If the candidacy bond is increased by this call, all current candidates which have a
     *deposit lower than the new bond will be kicked from the list and get their deposits
     *back.
     *
     *The origin for this call must be the `UpdateOrigin`.
     */
    set_candidacy_bond: TxDescriptor<Anonymize<Ialpmgmhr3gk5r>>;
    /**
     *Register this account as a collator candidate. The account must (a) already have
     *registered session keys and (b) be able to reserve the `CandidacyBond`.
     *
     *This call is not available to `Invulnerable` collators.
     */
    register_as_candidate: TxDescriptor<undefined>;
    /**
     *Deregister `origin` as a collator candidate. Note that the collator can only leave on
     *session change. The `CandidacyBond` will be unreserved immediately.
     *
     *This call will fail if the total number of candidates would drop below
     *`MinEligibleCollators`.
     */
    leave_intent: TxDescriptor<undefined>;
    /**
     *Add a new account `who` to the list of `Invulnerables` collators. `who` must have
     *registered session keys. If `who` is a candidate, they will be removed.
     *
     *The origin for this call must be the `UpdateOrigin`.
     */
    add_invulnerable: TxDescriptor<Anonymize<I4cbvqmqadhrea>>;
    /**
     *Remove an account `who` from the list of `Invulnerables` collators. `Invulnerables` must
     *be sorted.
     *
     *The origin for this call must be the `UpdateOrigin`.
     */
    remove_invulnerable: TxDescriptor<Anonymize<I4cbvqmqadhrea>>;
    /**
     *Update the candidacy bond of collator candidate `origin` to a new amount `new_deposit`.
     *
     *Setting a `new_deposit` that is lower than the current deposit while `origin` is
     *occupying a top-`DesiredCandidates` slot is not allowed.
     *
     *This call will fail if `origin` is not a collator candidate, the updated bond is lower
     *than the minimum candidacy bond, and/or the amount cannot be reserved.
     */
    update_bond: TxDescriptor<Anonymize<I3sdol54kg5jaq>>;
    /**
     *The caller `origin` replaces a candidate `target` in the collator candidate list by
     *reserving `deposit`. The amount `deposit` reserved by the caller must be greater than
     *the existing bond of the target it is trying to replace.
     *
     *This call will fail if the caller is already a collator candidate or invulnerable, the
     *caller does not have registered session keys, the target is not a collator candidate,
     *and/or the `deposit` amount cannot be reserved.
     */
    take_candidate_slot: TxDescriptor<Anonymize<I8fougodaj6di6>>;
  };
  Session: {
    /**
     *Sets the session key(s) of the function caller to `keys`.
     *Allows an account to set its session key prior to becoming a validator.
     *This doesn't take effect until the next session.
     *
     *The dispatch origin of this function must be signed.
     *
     *## Complexity
     *- `O(1)`. Actual cost depends on the number of length of `T::Keys::key_ids()` which is
     *  fixed.
     */
    set_keys: TxDescriptor<Anonymize<I81vt5eq60l4b6>>;
    /**
     *Removes any session key(s) of the function caller.
     *
     *This doesn't take effect until the next session.
     *
     *The dispatch origin of this function must be Signed and the account must be either be
     *convertible to a validator ID using the chain's typical addressing system (this usually
     *means being a controller account) or directly convertible into a validator ID (which
     *usually means being a stash account).
     *
     *## Complexity
     *- `O(1)` in number of key types. Actual cost depends on the number of length of
     *  `T::Keys::key_ids()` which is fixed.
     */
    purge_keys: TxDescriptor<undefined>;
  };
  EmaOracle: {
    /**
        
         */
    add_oracle: TxDescriptor<Anonymize<Iabgdocrka40v9>>;
    /**
        
         */
    remove_oracle: TxDescriptor<Anonymize<Iabgdocrka40v9>>;
  };
};
type IEvent = {
  System: {
    /**
     *An extrinsic completed successfully.
     */
    ExtrinsicSuccess: PlainDescriptor<Anonymize<Ia82mnkmeo2rhc>>;
    /**
     *An extrinsic failed.
     */
    ExtrinsicFailed: PlainDescriptor<Anonymize<I17lrc78ftgqcp>>;
    /**
     *`:code` was updated.
     */
    CodeUpdated: PlainDescriptor<undefined>;
    /**
     *A new account was created.
     */
    NewAccount: PlainDescriptor<Anonymize<Icbccs0ug47ilf>>;
    /**
     *An account was reaped.
     */
    KilledAccount: PlainDescriptor<Anonymize<Icbccs0ug47ilf>>;
    /**
     *On on-chain remark happened.
     */
    Remarked: PlainDescriptor<Anonymize<I855j4i3kr8ko1>>;
    /**
     *An upgrade was authorized.
     */
    UpgradeAuthorized: PlainDescriptor<Anonymize<Ibgl04rn6nbfm6>>;
  };
  Balances: {
    /**
     *An account was created with some free balance.
     */
    Endowed: PlainDescriptor<Anonymize<Icv68aq8841478>>;
    /**
     *An account was removed whose balance was non-zero but below ExistentialDeposit,
     *resulting in an outright loss.
     */
    DustLost: PlainDescriptor<Anonymize<Ic262ibdoec56a>>;
    /**
     *Transfer succeeded.
     */
    Transfer: PlainDescriptor<Anonymize<Iflcfm9b6nlmdd>>;
    /**
     *A balance was set by root.
     */
    BalanceSet: PlainDescriptor<Anonymize<Ijrsf4mnp3eka>>;
    /**
     *Some balance was reserved (moved from free to reserved).
     */
    Reserved: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Some balance was unreserved (moved from reserved to free).
     */
    Unreserved: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Some balance was moved from the reserve of the first account to the second account.
     *Final argument indicates the destination balance type.
     */
    ReserveRepatriated: PlainDescriptor<Anonymize<I8tjvj9uq4b7hi>>;
    /**
     *Some amount was deposited (e.g. for transaction fees).
     */
    Deposit: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Some amount was withdrawn from the account (e.g. for transaction fees).
     */
    Withdraw: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Some amount was removed from the account (e.g. for misbehavior).
     */
    Slashed: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Some amount was minted into an account.
     */
    Minted: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Some amount was burned from an account.
     */
    Burned: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Some amount was suspended from an account (it can be restored later).
     */
    Suspended: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Some amount was restored into an account.
     */
    Restored: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *An account was upgraded.
     */
    Upgraded: PlainDescriptor<Anonymize<I4cbvqmqadhrea>>;
    /**
     *Total issuance was increased by `amount`, creating a credit to be balanced.
     */
    Issued: PlainDescriptor<Anonymize<I3qt1hgg4djhgb>>;
    /**
     *Total issuance was decreased by `amount`, creating a debt to be balanced.
     */
    Rescinded: PlainDescriptor<Anonymize<I3qt1hgg4djhgb>>;
    /**
     *Some balance was locked.
     */
    Locked: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Some balance was unlocked.
     */
    Unlocked: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Some balance was frozen.
     */
    Frozen: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Some balance was thawed.
     */
    Thawed: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *The `TotalIssuance` was forcefully changed.
     */
    TotalIssuanceForced: PlainDescriptor<Anonymize<I4fooe9dun9o0t>>;
  };
  TransactionPayment: {
    /**
     *A transaction fee `actual_fee`, of which `tip` was added to the minimum inclusion fee,
     *has been paid by `who`.
     */
    TransactionFeePaid: PlainDescriptor<Anonymize<Ier2cke86dqbr2>>;
  };
  MultiTransactionPayment: {
    /**
     *CurrencySet
     *[who, currency]
     */
    CurrencySet: PlainDescriptor<Anonymize<I1o37fpk9vgbri>>;
    /**
     *New accepted currency added
     *[currency]
     */
    CurrencyAdded: PlainDescriptor<Anonymize<Ia5le7udkgbaq9>>;
    /**
     *Accepted currency removed
     *[currency]
     */
    CurrencyRemoved: PlainDescriptor<Anonymize<Ia5le7udkgbaq9>>;
    /**
     *Transaction fee paid in non-native currency
     *[Account, Currency, Native fee amount, Non-native fee amount, Destination account]
     */
    FeeWithdrawn: PlainDescriptor<Anonymize<I859063tfqget1>>;
  };
  Treasury: {
    /**
     *New proposal.
     */
    Proposed: PlainDescriptor<Anonymize<I44hc4lgsn4o1j>>;
    /**
     *We have ended a spend period and will now allocate funds.
     */
    Spending: PlainDescriptor<Anonymize<I8iksqi3eani0a>>;
    /**
     *Some funds have been allocated.
     */
    Awarded: PlainDescriptor<Anonymize<I16enopmju1p0q>>;
    /**
     *A proposal was rejected; funds were slashed.
     */
    Rejected: PlainDescriptor<Anonymize<Ifgqhle2413de7>>;
    /**
     *Some of our funds have been burnt.
     */
    Burnt: PlainDescriptor<Anonymize<I43kq8qudg7pq9>>;
    /**
     *Spending has finished; this is the amount that rolls over until next spend.
     */
    Rollover: PlainDescriptor<Anonymize<I76riseemre533>>;
    /**
     *Some funds have been deposited.
     */
    Deposit: PlainDescriptor<Anonymize<Ie5v6njpckr05b>>;
    /**
     *A new spend proposal has been approved.
     */
    SpendApproved: PlainDescriptor<Anonymize<I38bmcrmh852rk>>;
    /**
     *The inactive funds of the pallet have been updated.
     */
    UpdatedInactive: PlainDescriptor<Anonymize<I4hcillge8de5f>>;
    /**
     *A new asset spend proposal has been approved.
     */
    AssetSpendApproved: PlainDescriptor<Anonymize<I8usdc6tg7829p>>;
    /**
     *An approved spend was voided.
     */
    AssetSpendVoided: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *A payment happened.
     */
    Paid: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *A payment failed and can be retried.
     */
    PaymentFailed: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *A spend was processed and removed from the storage. It might have been successfully
     *paid or it may have expired.
     */
    SpendProcessed: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
  };
  Utility: {
    /**
     *Batch of dispatches did not complete fully. Index of first failing dispatch given, as
     *well as the error.
     */
    BatchInterrupted: PlainDescriptor<Anonymize<Idrghm97v133l7>>;
    /**
     *Batch of dispatches completed fully with no error.
     */
    BatchCompleted: PlainDescriptor<undefined>;
    /**
     *Batch of dispatches completed but has errors.
     */
    BatchCompletedWithErrors: PlainDescriptor<undefined>;
    /**
     *A single item within a Batch of dispatches has completed with no error.
     */
    ItemCompleted: PlainDescriptor<undefined>;
    /**
     *A single item within a Batch of dispatches has completed with error.
     */
    ItemFailed: PlainDescriptor<Anonymize<I2bgne8ai793cl>>;
    /**
     *A call was dispatched.
     */
    DispatchedAs: PlainDescriptor<Anonymize<I1d43pfvgh75ar>>;
  };
  Preimage: {
    /**
     *A preimage has been noted.
     */
    Noted: PlainDescriptor<Anonymize<I1jm8m1rh9e20v>>;
    /**
     *A preimage has been requested.
     */
    Requested: PlainDescriptor<Anonymize<I1jm8m1rh9e20v>>;
    /**
     *A preimage has ben cleared.
     */
    Cleared: PlainDescriptor<Anonymize<I1jm8m1rh9e20v>>;
  };
  Identity: {
    /**
     *A name was set or reset (which will remove all judgements).
     */
    IdentitySet: PlainDescriptor<Anonymize<I4cbvqmqadhrea>>;
    /**
     *A name was cleared, and the given balance returned.
     */
    IdentityCleared: PlainDescriptor<Anonymize<Iep1lmt6q3s6r3>>;
    /**
     *A name was removed and the given balance slashed.
     */
    IdentityKilled: PlainDescriptor<Anonymize<Iep1lmt6q3s6r3>>;
    /**
     *A judgement was asked from a registrar.
     */
    JudgementRequested: PlainDescriptor<Anonymize<I1fac16213rie2>>;
    /**
     *A judgement request was retracted.
     */
    JudgementUnrequested: PlainDescriptor<Anonymize<I1fac16213rie2>>;
    /**
     *A judgement was given by a registrar.
     */
    JudgementGiven: PlainDescriptor<Anonymize<Ifjt77oc391o43>>;
    /**
     *A registrar was added.
     */
    RegistrarAdded: PlainDescriptor<Anonymize<Itvt1jsipv0lc>>;
    /**
     *A sub-identity was added to an identity and the deposit paid.
     */
    SubIdentityAdded: PlainDescriptor<Anonymize<Ick3mveut33f44>>;
    /**
     *A sub-identity was removed from an identity and the deposit freed.
     */
    SubIdentityRemoved: PlainDescriptor<Anonymize<Ick3mveut33f44>>;
    /**
     *A sub-identity was cleared, and the given deposit repatriated from the
     *main identity account to the sub-identity account.
     */
    SubIdentityRevoked: PlainDescriptor<Anonymize<Ick3mveut33f44>>;
    /**
     *A username authority was added.
     */
    AuthorityAdded: PlainDescriptor<Anonymize<I2rg5btjrsqec0>>;
    /**
     *A username authority was removed.
     */
    AuthorityRemoved: PlainDescriptor<Anonymize<I2rg5btjrsqec0>>;
    /**
     *A username was set for `who`.
     */
    UsernameSet: PlainDescriptor<Anonymize<Ibdqerrooruuq9>>;
    /**
     *A username was queued, but `who` must accept it prior to `expiration`.
     */
    UsernameQueued: PlainDescriptor<Anonymize<I8u2ba9jeiu6q0>>;
    /**
     *A queued username passed its expiration without being claimed and was removed.
     */
    PreapprovalExpired: PlainDescriptor<Anonymize<I7ieadb293k6b4>>;
    /**
     *A username was set as a primary and can be looked up from `who`.
     */
    PrimaryUsernameSet: PlainDescriptor<Anonymize<Ibdqerrooruuq9>>;
    /**
     *A dangling username (as in, a username corresponding to an account that has removed its
     *identity) has been removed.
     */
    DanglingUsernameRemoved: PlainDescriptor<Anonymize<Ibdqerrooruuq9>>;
  };
  Democracy: {
    /**
     *A motion has been proposed by a public account.
     */
    Proposed: PlainDescriptor<Anonymize<I3peh714diura8>>;
    /**
     *A public proposal has been tabled for referendum vote.
     */
    Tabled: PlainDescriptor<Anonymize<I3peh714diura8>>;
    /**
     *An external proposal has been tabled.
     */
    ExternalTabled: PlainDescriptor<undefined>;
    /**
     *A referendum has begun.
     */
    Started: PlainDescriptor<Anonymize<I62ffgu6q2478o>>;
    /**
     *A proposal has been approved by referendum.
     */
    Passed: PlainDescriptor<Anonymize<Ied9mja4bq7va8>>;
    /**
     *A proposal has been rejected by referendum.
     */
    NotPassed: PlainDescriptor<Anonymize<Ied9mja4bq7va8>>;
    /**
     *A referendum has been cancelled.
     */
    Cancelled: PlainDescriptor<Anonymize<Ied9mja4bq7va8>>;
    /**
     *An account has delegated their vote to another account.
     */
    Delegated: PlainDescriptor<Anonymize<I10r7il4gvbcae>>;
    /**
     *An account has cancelled a previous delegation operation.
     */
    Undelegated: PlainDescriptor<Anonymize<Icbccs0ug47ilf>>;
    /**
     *An external proposal has been vetoed.
     */
    Vetoed: PlainDescriptor<Anonymize<I2c00i2bngegk9>>;
    /**
     *A proposal_hash has been blacklisted permanently.
     */
    Blacklisted: PlainDescriptor<Anonymize<I2ev73t79f46tb>>;
    /**
     *An account has voted in a referendum
     */
    Voted: PlainDescriptor<Anonymize<Iet7kfijhihjik>>;
    /**
     *An account has secconded a proposal
     */
    Seconded: PlainDescriptor<Anonymize<I2vrbos7ogo6ps>>;
    /**
     *A proposal got canceled.
     */
    ProposalCanceled: PlainDescriptor<Anonymize<I9mnj4k4u8ls2c>>;
    /**
     *Metadata for a proposal or a referendum has been set.
     */
    MetadataSet: PlainDescriptor<Anonymize<Iffeo46j957abe>>;
    /**
     *Metadata for a proposal or a referendum has been cleared.
     */
    MetadataCleared: PlainDescriptor<Anonymize<Iffeo46j957abe>>;
    /**
     *Metadata has been transferred to new owner.
     */
    MetadataTransferred: PlainDescriptor<Anonymize<I4ljshcevmm3p2>>;
  };
  Elections: {
    /**
     *A new term with new_members. This indicates that enough candidates existed to run
     *the election, not that enough have has been elected. The inner value must be examined
     *for this purpose. A `NewTerm(\[\])` indicates that some candidates got their bond
     *slashed and none were elected, whilst `EmptyTerm` means that no candidates existed to
     *begin with.
     */
    NewTerm: PlainDescriptor<Anonymize<Iaofef34v2445a>>;
    /**
     *No (or not enough) candidates existed for this round. This is different from
     *`NewTerm(\[\])`. See the description of `NewTerm`.
     */
    EmptyTerm: PlainDescriptor<undefined>;
    /**
     *Internal error happened while trying to perform election.
     */
    ElectionError: PlainDescriptor<undefined>;
    /**
     *A member has been removed. This should always be followed by either `NewTerm` or
     *`EmptyTerm`.
     */
    MemberKicked: PlainDescriptor<Anonymize<Ie3gphha4ejh40>>;
    /**
     *Someone has renounced their candidacy.
     */
    Renounced: PlainDescriptor<Anonymize<I4b66js88p45m8>>;
    /**
     *A candidate was slashed by amount due to failing to obtain a seat as member or
     *runner-up.
     *
     *Note that old members and runners-up are also candidates.
     */
    CandidateSlashed: PlainDescriptor<Anonymize<I50d9r8lrdga93>>;
    /**
     *A seat holder was slashed by amount by being forcefully removed from the set.
     */
    SeatHolderSlashed: PlainDescriptor<Anonymize<I27avf13g71mla>>;
  };
  Council: {
    /**
     *A motion (given hash) has been proposed (by given account) with a threshold (given
     *`MemberCount`).
     */
    Proposed: PlainDescriptor<Anonymize<Ift6f10887nk72>>;
    /**
     *A motion (given hash) has been voted on by given account, leaving
     *a tally (yes votes and no votes given respectively as `MemberCount`).
     */
    Voted: PlainDescriptor<Anonymize<I7qc53b1tvqjg2>>;
    /**
     *A motion was approved by the required threshold.
     */
    Approved: PlainDescriptor<Anonymize<I2ev73t79f46tb>>;
    /**
     *A motion was not approved by the required threshold.
     */
    Disapproved: PlainDescriptor<Anonymize<I2ev73t79f46tb>>;
    /**
     *A motion was executed; result will be `Ok` if it returned without error.
     */
    Executed: PlainDescriptor<Anonymize<I4q0j6fg2t2god>>;
    /**
     *A single member did some action; result will be `Ok` if it returned without error.
     */
    MemberExecuted: PlainDescriptor<Anonymize<I4q0j6fg2t2god>>;
    /**
     *A proposal was closed because its threshold was reached or after its duration was up.
     */
    Closed: PlainDescriptor<Anonymize<Iak7fhrgb9jnnq>>;
  };
  TechnicalCommittee: {
    /**
     *A motion (given hash) has been proposed (by given account) with a threshold (given
     *`MemberCount`).
     */
    Proposed: PlainDescriptor<Anonymize<Ift6f10887nk72>>;
    /**
     *A motion (given hash) has been voted on by given account, leaving
     *a tally (yes votes and no votes given respectively as `MemberCount`).
     */
    Voted: PlainDescriptor<Anonymize<I7qc53b1tvqjg2>>;
    /**
     *A motion was approved by the required threshold.
     */
    Approved: PlainDescriptor<Anonymize<I2ev73t79f46tb>>;
    /**
     *A motion was not approved by the required threshold.
     */
    Disapproved: PlainDescriptor<Anonymize<I2ev73t79f46tb>>;
    /**
     *A motion was executed; result will be `Ok` if it returned without error.
     */
    Executed: PlainDescriptor<Anonymize<I4q0j6fg2t2god>>;
    /**
     *A single member did some action; result will be `Ok` if it returned without error.
     */
    MemberExecuted: PlainDescriptor<Anonymize<I4q0j6fg2t2god>>;
    /**
     *A proposal was closed because its threshold was reached or after its duration was up.
     */
    Closed: PlainDescriptor<Anonymize<Iak7fhrgb9jnnq>>;
  };
  Tips: {
    /**
     *A new tip suggestion has been opened.
     */
    NewTip: PlainDescriptor<Anonymize<Iep7an7g10jgpc>>;
    /**
     *A tip suggestion has reached threshold and is closing.
     */
    TipClosing: PlainDescriptor<Anonymize<Iep7an7g10jgpc>>;
    /**
     *A tip suggestion has been closed.
     */
    TipClosed: PlainDescriptor<Anonymize<Ierev02d74bpoa>>;
    /**
     *A tip suggestion has been retracted.
     */
    TipRetracted: PlainDescriptor<Anonymize<Iep7an7g10jgpc>>;
    /**
     *A tip suggestion has been slashed.
     */
    TipSlashed: PlainDescriptor<Anonymize<Ic836gl3ins837>>;
  };
  Proxy: {
    /**
     *A proxy was executed correctly, with the given.
     */
    ProxyExecuted: PlainDescriptor<Anonymize<I1d43pfvgh75ar>>;
    /**
     *A pure account has been created by new proxy with given
     *disambiguation index and proxy type.
     */
    PureCreated: PlainDescriptor<Anonymize<Ic3vmcebni2jj7>>;
    /**
     *An announcement was placed to make a call in the future.
     */
    Announced: PlainDescriptor<Anonymize<I2ur0oeqg495j8>>;
    /**
     *A proxy was added.
     */
    ProxyAdded: PlainDescriptor<Anonymize<I3opji3hcv2fmd>>;
    /**
     *A proxy was removed.
     */
    ProxyRemoved: PlainDescriptor<Anonymize<I3opji3hcv2fmd>>;
  };
  Multisig: {
    /**
     *A new multisig operation has begun.
     */
    NewMultisig: PlainDescriptor<Anonymize<Iep27ialq4a7o7>>;
    /**
     *A multisig operation has been approved by someone.
     */
    MultisigApproval: PlainDescriptor<Anonymize<Iasu5jvoqr43mv>>;
    /**
     *A multisig operation has been executed.
     */
    MultisigExecuted: PlainDescriptor<Anonymize<I1s1qkhv9546hq>>;
    /**
     *A multisig operation has been cancelled.
     */
    MultisigCancelled: PlainDescriptor<Anonymize<I5qolde99acmd1>>;
  };
  Uniques: {
    /**
     *A `collection` was created.
     */
    Created: PlainDescriptor<Anonymize<I86naabrotue2j>>;
    /**
     *A `collection` was force-created.
     */
    ForceCreated: PlainDescriptor<Anonymize<I2r637rurl4t61>>;
    /**
     *A `collection` was destroyed.
     */
    Destroyed: PlainDescriptor<Anonymize<I88sl1jplq27bh>>;
    /**
     *An `item` was issued.
     */
    Issued: PlainDescriptor<Anonymize<I846j8gk91gp4q>>;
    /**
     *An `item` was transferred.
     */
    Transferred: PlainDescriptor<Anonymize<Iar6hlsh10hqst>>;
    /**
     *An `item` was destroyed.
     */
    Burned: PlainDescriptor<Anonymize<I846j8gk91gp4q>>;
    /**
     *Some `item` was frozen.
     */
    Frozen: PlainDescriptor<Anonymize<I92ucef7ff2o7l>>;
    /**
     *Some `item` was thawed.
     */
    Thawed: PlainDescriptor<Anonymize<I92ucef7ff2o7l>>;
    /**
     *Some `collection` was frozen.
     */
    CollectionFrozen: PlainDescriptor<Anonymize<I88sl1jplq27bh>>;
    /**
     *Some `collection` was thawed.
     */
    CollectionThawed: PlainDescriptor<Anonymize<I88sl1jplq27bh>>;
    /**
     *The owner changed.
     */
    OwnerChanged: PlainDescriptor<Anonymize<I2970lus2v0qct>>;
    /**
     *The management team changed.
     */
    TeamChanged: PlainDescriptor<Anonymize<I1vsbo63n9pu69>>;
    /**
     *An `item` of a `collection` has been approved by the `owner` for transfer by
     *a `delegate`.
     */
    ApprovedTransfer: PlainDescriptor<Anonymize<I89nkv9adctj3n>>;
    /**
     *An approval for a `delegate` account to transfer the `item` of an item
     *`collection` was cancelled by its `owner`.
     */
    ApprovalCancelled: PlainDescriptor<Anonymize<I89nkv9adctj3n>>;
    /**
     *A `collection` has had its attributes changed by the `Force` origin.
     */
    ItemStatusChanged: PlainDescriptor<Anonymize<I88sl1jplq27bh>>;
    /**
     *New metadata has been set for a `collection`.
     */
    CollectionMetadataSet: PlainDescriptor<Anonymize<I9oai3q0an1tbo>>;
    /**
     *Metadata has been cleared for a `collection`.
     */
    CollectionMetadataCleared: PlainDescriptor<Anonymize<I88sl1jplq27bh>>;
    /**
     *New metadata has been set for an item.
     */
    MetadataSet: PlainDescriptor<Anonymize<I9e4bfe80t2int>>;
    /**
     *Metadata has been cleared for an item.
     */
    MetadataCleared: PlainDescriptor<Anonymize<I92ucef7ff2o7l>>;
    /**
     *Metadata has been cleared for an item.
     */
    Redeposited: PlainDescriptor<Anonymize<I5seehdocrcoau>>;
    /**
     *New attribute metadata has been set for a `collection` or `item`.
     */
    AttributeSet: PlainDescriptor<Anonymize<I62ht2i39rtkaa>>;
    /**
     *Attribute metadata has been cleared for a `collection` or `item`.
     */
    AttributeCleared: PlainDescriptor<Anonymize<Ichf8eu9t3dtc2>>;
    /**
     *Ownership acceptance has changed for an account.
     */
    OwnershipAcceptanceChanged: PlainDescriptor<Anonymize<Ic2kg6kak0gd23>>;
    /**
     *Max supply has been set for a collection.
     */
    CollectionMaxSupplySet: PlainDescriptor<Anonymize<Idj9k8sn80h3m6>>;
    /**
     *The price was set for the instance.
     */
    ItemPriceSet: PlainDescriptor<Anonymize<I2odpdgf7k5003>>;
    /**
     *The price for the instance was removed.
     */
    ItemPriceRemoved: PlainDescriptor<Anonymize<I92ucef7ff2o7l>>;
    /**
     *An item was bought.
     */
    ItemBought: PlainDescriptor<Anonymize<Ifmob7l1au7mdj>>;
  };
  StateTrieMigration: {
    /**
     *Given number of `(top, child)` keys were migrated respectively, with the given
     *`compute`.
     */
    Migrated: PlainDescriptor<Anonymize<Iagqcb06kbevb1>>;
    /**
     *Some account got slashed by the given amount.
     */
    Slashed: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *The auto migration task finished.
     */
    AutoMigrationFinished: PlainDescriptor<undefined>;
    /**
     *Migration got halted due to an error or miss-configuration.
     */
    Halted: PlainDescriptor<Anonymize<Iec8defeh924b6>>;
  };
  ConvictionVoting: {
    /**
     *An account has delegated their vote to another account. \[who, target\]
     */
    Delegated: PlainDescriptor<Anonymize<I2na29tt2afp0j>>;
    /**
     *An \[account\] has cancelled a previous delegation operation.
     */
    Undelegated: PlainDescriptor<SS58String>;
  };
  Referenda: {
    /**
     *A referendum has been submitted.
     */
    Submitted: PlainDescriptor<Anonymize<I229ijht536qdu>>;
    /**
     *The decision deposit has been placed.
     */
    DecisionDepositPlaced: PlainDescriptor<Anonymize<I62nte77gksm0f>>;
    /**
     *The decision deposit has been refunded.
     */
    DecisionDepositRefunded: PlainDescriptor<Anonymize<I62nte77gksm0f>>;
    /**
     *A deposit has been slashed.
     */
    DepositSlashed: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *A referendum has moved into the deciding phase.
     */
    DecisionStarted: PlainDescriptor<Anonymize<I9cg2delv92pvq>>;
    /**
        
         */
    ConfirmStarted: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
        
         */
    ConfirmAborted: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *A referendum has ended its confirmation phase and is ready for approval.
     */
    Confirmed: PlainDescriptor<Anonymize<Ilhp45uime5tp>>;
    /**
     *A referendum has been approved and its proposal has been scheduled.
     */
    Approved: PlainDescriptor<Anonymize<I666bl2fqjkejo>>;
    /**
     *A proposal has been rejected by referendum.
     */
    Rejected: PlainDescriptor<Anonymize<Ilhp45uime5tp>>;
    /**
     *A referendum has been timed out without being decided.
     */
    TimedOut: PlainDescriptor<Anonymize<Ilhp45uime5tp>>;
    /**
     *A referendum has been cancelled.
     */
    Cancelled: PlainDescriptor<Anonymize<Ilhp45uime5tp>>;
    /**
     *A referendum has been killed.
     */
    Killed: PlainDescriptor<Anonymize<Ilhp45uime5tp>>;
    /**
     *The submission deposit has been refunded.
     */
    SubmissionDepositRefunded: PlainDescriptor<Anonymize<I62nte77gksm0f>>;
    /**
     *Metadata for a referendum has been set.
     */
    MetadataSet: PlainDescriptor<Anonymize<I4f1hv034jf1dt>>;
    /**
     *Metadata for a referendum has been cleared.
     */
    MetadataCleared: PlainDescriptor<Anonymize<I4f1hv034jf1dt>>;
  };
  Whitelist: {
    /**
        
         */
    CallWhitelisted: PlainDescriptor<Anonymize<I1adbcfi5uc62r>>;
    /**
        
         */
    WhitelistedCallRemoved: PlainDescriptor<Anonymize<I1adbcfi5uc62r>>;
    /**
        
         */
    WhitelistedCallDispatched: PlainDescriptor<Anonymize<I7tn5uocmj423n>>;
  };
  Dispatcher: {
    /**
        
         */
    TreasuryManagerCallDispatched: PlainDescriptor<Anonymize<I7tn5uocmj423n>>;
    /**
        
         */
    AaveManagerCallDispatched: PlainDescriptor<Anonymize<I7tn5uocmj423n>>;
  };
  AssetRegistry: {
    /**
     *Existential deposit for insufficinet asset was paid.
     *`SufficiencyCheck` triggers this event.
     */
    ExistentialDepositPaid: PlainDescriptor<Anonymize<I6cn8fgvhihc8u>>;
    /**
     *Asset was registered.
     */
    Registered: PlainDescriptor<Anonymize<Iaa8ldhnekkm2a>>;
    /**
     *Asset was updated.
     */
    Updated: PlainDescriptor<Anonymize<Iaa8ldhnekkm2a>>;
    /**
     *Native location set for an asset.
     */
    LocationSet: PlainDescriptor<Anonymize<Ir72g75rutn0i>>;
    /**
     *Asset was banned.
     */
    AssetBanned: PlainDescriptor<Anonymize<Ia5le7udkgbaq9>>;
    /**
     *Asset's ban was removed.
     */
    AssetUnbanned: PlainDescriptor<Anonymize<Ia5le7udkgbaq9>>;
  };
  Claims: {
    /**
        
         */
    Claim: PlainDescriptor<Anonymize<I7i2rquf9o1sc4>>;
  };
  CollatorRewards: {
    /**
     *Collator was rewarded.
     */
    CollatorRewarded: PlainDescriptor<Anonymize<I32ndibr4v59gl>>;
  };
  Omnipool: {
    /**
     *An asset was added to Omnipool
     */
    TokenAdded: PlainDescriptor<Anonymize<Ichvhj93no2r9s>>;
    /**
     *An asset was removed from Omnipool
     */
    TokenRemoved: PlainDescriptor<Anonymize<Ibo4guh1r2d417>>;
    /**
     *Liquidity of an asset was added to Omnipool.
     */
    LiquidityAdded: PlainDescriptor<Anonymize<I5bdik3e9dtr9m>>;
    /**
     *Liquidity of an asset was removed from Omnipool.
     */
    LiquidityRemoved: PlainDescriptor<Anonymize<Idml4kfacbec4q>>;
    /**
     *PRotocol Liquidity was removed from Omnipool.
     */
    ProtocolLiquidityRemoved: PlainDescriptor<Anonymize<I5po34152rrdd1>>;
    /**
     *Sell trade executed.
     *Deprecated. Replaced by pallet_broadcast::Swapped
     */
    SellExecuted: PlainDescriptor<Anonymize<I8gu0uupiacpfc>>;
    /**
     *Buy trade executed.
     *Deprecated. Replaced by pallet_broadcast::Swapped
     */
    BuyExecuted: PlainDescriptor<Anonymize<I8gu0uupiacpfc>>;
    /**
     *LP Position was created and NFT instance minted.
     */
    PositionCreated: PlainDescriptor<Anonymize<I3qaapujidulnv>>;
    /**
     *LP Position was destroyed and NFT instance burned.
     */
    PositionDestroyed: PlainDescriptor<Anonymize<I5u2c8nrbcec0n>>;
    /**
     *LP Position was updated.
     */
    PositionUpdated: PlainDescriptor<Anonymize<I3qaapujidulnv>>;
    /**
     *Asset's tradable state has been updated.
     */
    TradableStateUpdated: PlainDescriptor<Anonymize<Iefviakco48cs2>>;
    /**
     *Amount has been refunded for asset which has not been accepted to add to omnipool.
     */
    AssetRefunded: PlainDescriptor<Anonymize<Iakb7idgif10m8>>;
    /**
     *Asset's weight cap has been updated.
     */
    AssetWeightCapUpdated: PlainDescriptor<Anonymize<Id7aqsj1u6b2r2>>;
  };
  TransactionPause: {
    /**
     *Paused transaction
     */
    TransactionPaused: PlainDescriptor<Anonymize<I193fovq1blcqu>>;
    /**
     *Unpaused transaction
     */
    TransactionUnpaused: PlainDescriptor<Anonymize<I193fovq1blcqu>>;
  };
  Duster: {
    /**
     *Account dusted.
     */
    Dusted: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Account added to non-dustable list.
     */
    Added: PlainDescriptor<Anonymize<I4cbvqmqadhrea>>;
    /**
     *Account removed from non-dustable list.
     */
    Removed: PlainDescriptor<Anonymize<I4cbvqmqadhrea>>;
  };
  OmnipoolWarehouseLM: {
    /**
     *Global farm accumulated reward per share was updated.
     */
    GlobalFarmAccRPZUpdated: PlainDescriptor<Anonymize<I4qeb32vu4p1o2>>;
    /**
     *Yield farm accumulated reward per valued share was updated.
     */
    YieldFarmAccRPVSUpdated: PlainDescriptor<Anonymize<Icatb69nkfsv2d>>;
    /**
     *Global farm has no more rewards to distribute in the moment.
     */
    AllRewardsDistributed: PlainDescriptor<Anonymize<I9q8qmop6bko5m>>;
  };
  OmnipoolLiquidityMining: {
    /**
     *New global farm was created.
     */
    GlobalFarmCreated: PlainDescriptor<Anonymize<Iao3tfuiovep78>>;
    /**
     *Global farm was updated
     */
    GlobalFarmUpdated: PlainDescriptor<Anonymize<I1cq0joe6ba7us>>;
    /**
     *Global farm was terminated.
     */
    GlobalFarmTerminated: PlainDescriptor<Anonymize<I8p8774nu1gec7>>;
    /**
     *New yield farm was added to the farm.
     */
    YieldFarmCreated: PlainDescriptor<Anonymize<I58kb78e8933i0>>;
    /**
     *Yield farm multiplier was updated.
     */
    YieldFarmUpdated: PlainDescriptor<Anonymize<Idhf8n2m782jc6>>;
    /**
     *Yield farm for `asset_id` was stopped.
     */
    YieldFarmStopped: PlainDescriptor<Anonymize<I8qbcd8kjt9b35>>;
    /**
     *Yield farm for `asset_id` was resumed.
     */
    YieldFarmResumed: PlainDescriptor<Anonymize<Idhf8n2m782jc6>>;
    /**
     *Yield farm was terminated from the global farm.
     */
    YieldFarmTerminated: PlainDescriptor<Anonymize<I8qbcd8kjt9b35>>;
    /**
     *New LP shares(LP position) were deposited.
     */
    SharesDeposited: PlainDescriptor<Anonymize<I9fddbmtajbhgk>>;
    /**
     *Already locked LP shares were redeposited to another yield farm.
     */
    SharesRedeposited: PlainDescriptor<Anonymize<I9fddbmtajbhgk>>;
    /**
     *Rewards were claimed.
     */
    RewardClaimed: PlainDescriptor<Anonymize<I16oglmrf6q8h2>>;
    /**
     *LP shares were withdrawn.
     */
    SharesWithdrawn: PlainDescriptor<Anonymize<I56vurdc4pd324>>;
    /**
     *All LP shares were unlocked and NFT representing deposit was destroyed.
     */
    DepositDestroyed: PlainDescriptor<Anonymize<Iv3iro9hpdvcu>>;
  };
  OTC: {
    /**
     *An Order has been cancelled
     */
    Cancelled: PlainDescriptor<Anonymize<Ibq6b0nsk23kj8>>;
    /**
     *An Order has been completely filled
     *Deprecated. Replaced by pallet_broadcast::Swapped
     */
    Filled: PlainDescriptor<Anonymize<I725512ll00rul>>;
    /**
     *An Order has been partially filled
     *Deprecated. Replaced by pallet_broadcast::Swapped
     */
    PartiallyFilled: PlainDescriptor<Anonymize<I725512ll00rul>>;
    /**
     *An Order has been placed
     */
    Placed: PlainDescriptor<Anonymize<Ibnohbnq46n24i>>;
  };
  CircuitBreaker: {
    /**
     *Trade volume limit of an asset was changed.
     */
    TradeVolumeLimitChanged: PlainDescriptor<Anonymize<I2i1tilmsb1rl1>>;
    /**
     *Add liquidity limit of an asset was changed.
     */
    AddLiquidityLimitChanged: PlainDescriptor<Anonymize<I4l0u1h71fhj81>>;
    /**
     *Remove liquidity limit of an asset was changed.
     */
    RemoveLiquidityLimitChanged: PlainDescriptor<Anonymize<I4l0u1h71fhj81>>;
  };
  Router: {
    /**
     *The route with trades has been successfully executed
     */
    Executed: PlainDescriptor<Anonymize<If1007933akv96>>;
    /**
     *The route with trades has been successfully executed
     */
    RouteUpdated: PlainDescriptor<Anonymize<I11glevchscfbg>>;
  };
  Staking: {
    /**
     *New staking position was created and NFT was minted.
     */
    PositionCreated: PlainDescriptor<Anonymize<Ifrsdu7763lo3e>>;
    /**
     *Staked amount for existing position was increased.
     */
    StakeAdded: PlainDescriptor<Anonymize<I1rcm9o2k31p0u>>;
    /**
     *Rewards were claimed.
     */
    RewardsClaimed: PlainDescriptor<Anonymize<I90op6i3kabg2t>>;
    /**
     *Staked amount was withdrawn and NFT was burned.
     */
    Unstaked: PlainDescriptor<Anonymize<If7ps0a75qku2k>>;
    /**
     *Staking was initialized.
     */
    StakingInitialized: PlainDescriptor<Anonymize<I4qcsbrcg45e5p>>;
    /**
     *Staking's `accumulated_reward_per_stake` was updated.
     */
    AccumulatedRpsUpdated: PlainDescriptor<Anonymize<I2gupahud9i8tv>>;
  };
  Stableswap: {
    /**
     *A pool was created.
     */
    PoolCreated: PlainDescriptor<Anonymize<Idmv46n4bkamls>>;
    /**
     *Pool fee has been updated.
     */
    FeeUpdated: PlainDescriptor<Anonymize<Ics8sn0t3vlpat>>;
    /**
     *Liquidity of an asset was added to a pool.
     */
    LiquidityAdded: PlainDescriptor<Anonymize<I88qo502j1hm6r>>;
    /**
     *Liquidity removed.
     */
    LiquidityRemoved: PlainDescriptor<Anonymize<I44sqbdseede38>>;
    /**
     *Sell trade executed. Trade fee paid in asset leaving the pool (already subtracted from amount_out).
     *Deprecated. Replaced by pallet_broadcast::Swapped
     */
    SellExecuted: PlainDescriptor<Anonymize<I203slt75ll6b5>>;
    /**
     *Buy trade executed. Trade fee paid in asset entering the pool (already included in amount_in).
     *Deprecated. Replaced by pallet_broadcast::Swapped
     */
    BuyExecuted: PlainDescriptor<Anonymize<I203slt75ll6b5>>;
    /**
     *Asset's tradable state has been updated.
     */
    TradableStateUpdated: PlainDescriptor<Anonymize<Iest0fomljvrb6>>;
    /**
     *Amplification of a pool has been scheduled to change.
     */
    AmplificationChanging: PlainDescriptor<Anonymize<I9buamva6m987d>>;
    /**
     *A pool has been destroyed.
     */
    PoolDestroyed: PlainDescriptor<Anonymize<I931cottvong90>>;
  };
  Bonds: {
    /**
     *A bond asset was registered
     */
    TokenCreated: PlainDescriptor<Anonymize<I15i908ukdv01j>>;
    /**
     *New bond were issued
     */
    Issued: PlainDescriptor<Anonymize<I3md9r9ud9jcmi>>;
    /**
     *Bonds were redeemed
     */
    Redeemed: PlainDescriptor<Anonymize<I4rlrhubptb25s>>;
  };
  OtcSettlements: {
    /**
     *A trade has been executed
     */
    Executed: PlainDescriptor<Anonymize<Ibb0j2hs2i32f5>>;
  };
  LBP: {
    /**
     *Pool was created by the `CreatePool` origin.
     */
    PoolCreated: PlainDescriptor<Anonymize<Iae6luacdfosbm>>;
    /**
     *Pool data were updated.
     */
    PoolUpdated: PlainDescriptor<Anonymize<Iae6luacdfosbm>>;
    /**
     *New liquidity was provided to the pool.
     */
    LiquidityAdded: PlainDescriptor<Anonymize<Idvrgp2jjkjaee>>;
    /**
     *Liquidity was removed from the pool and the pool was destroyed.
     */
    LiquidityRemoved: PlainDescriptor<Anonymize<Idvrgp2jjkjaee>>;
    /**
     *Sale executed.
     *Deprecated. Replaced by pallet_broadcast::Swapped
     */
    SellExecuted: PlainDescriptor<Anonymize<I6q2a2o24kbh1n>>;
    /**
     *Purchase executed.
     *Deprecated. Replaced by pallet_broadcast::Swapped
     */
    BuyExecuted: PlainDescriptor<Anonymize<Iflfus32kckdgg>>;
  };
  XYK: {
    /**
     *New liquidity was provided to the pool.
     */
    LiquidityAdded: PlainDescriptor<Anonymize<Idvrgp2jjkjaee>>;
    /**
     *Liquidity was removed from the pool.
     */
    LiquidityRemoved: PlainDescriptor<Anonymize<I7e9lbuqrul79d>>;
    /**
     *Pool was created.
     */
    PoolCreated: PlainDescriptor<Anonymize<Idpc6o3gv6oduv>>;
    /**
     *Pool was destroyed.
     */
    PoolDestroyed: PlainDescriptor<Anonymize<I789ltv1nd8rlg>>;
    /**
     *Asset sale executed.
     *Deprecated. Replaced by pallet_broadcast::Swapped
     */
    SellExecuted: PlainDescriptor<Anonymize<I5nm6uebbrcvd2>>;
    /**
     *Asset purchase executed.
     *Deprecated. Replaced by pallet_broadcast::Swapped
     */
    BuyExecuted: PlainDescriptor<Anonymize<I1966f4idd9els>>;
  };
  Referrals: {
    /**
     *Referral code has been registered.
     */
    CodeRegistered: PlainDescriptor<Anonymize<I8hof8vbjel5j0>>;
    /**
     *Referral code has been linked to an account.
     */
    CodeLinked: PlainDescriptor<Anonymize<Ic20as3skakdjb>>;
    /**
     *Asset has been converted to RewardAsset.
     */
    Converted: PlainDescriptor<Anonymize<Ieg2h8ei7d5hi>>;
    /**
     *Rewards claimed.
     */
    Claimed: PlainDescriptor<Anonymize<I8c5lgkcpg07sj>>;
    /**
     *New asset rewards has been set.
     */
    AssetRewardsUpdated: PlainDescriptor<Anonymize<Ionfhf9va2t31>>;
    /**
     *Referrer reached new level.
     */
    LevelUp: PlainDescriptor<Anonymize<Ieas3thfe5cojl>>;
  };
  Liquidation: {
    /**
     *Money market position has been liquidated
     */
    Liquidated: PlainDescriptor<Anonymize<I2rjku3c860luj>>;
  };
  Tokens: {
    /**
     *An account was created with some free balance.
     */
    Endowed: PlainDescriptor<Anonymize<I24s4g6gkj5oec>>;
    /**
     *An account was removed whose balance was non-zero but below
     *ExistentialDeposit, resulting in an outright loss.
     */
    DustLost: PlainDescriptor<Anonymize<I24s4g6gkj5oec>>;
    /**
     *Transfer succeeded.
     */
    Transfer: PlainDescriptor<Anonymize<I82vqlr4shhaso>>;
    /**
     *Some balance was reserved (moved from free to reserved).
     */
    Reserved: PlainDescriptor<Anonymize<I24s4g6gkj5oec>>;
    /**
     *Some balance was unreserved (moved from reserved to free).
     */
    Unreserved: PlainDescriptor<Anonymize<I24s4g6gkj5oec>>;
    /**
     *Some reserved balance was repatriated (moved from reserved to
     *another account).
     */
    ReserveRepatriated: PlainDescriptor<Anonymize<I2age4ibb0qdmq>>;
    /**
     *A balance was set by root.
     */
    BalanceSet: PlainDescriptor<Anonymize<I4do2q74i35m>>;
    /**
     *The total issuance of an currency has been set
     */
    TotalIssuanceSet: PlainDescriptor<Anonymize<Iehf2srrsvlrt4>>;
    /**
     *Some balances were withdrawn (e.g. pay for transaction fee)
     */
    Withdrawn: PlainDescriptor<Anonymize<I24s4g6gkj5oec>>;
    /**
     *Some balances were slashed (e.g. due to mis-behavior)
     */
    Slashed: PlainDescriptor<Anonymize<I1a3321bv4rsn2>>;
    /**
     *Deposited some balance into an account
     */
    Deposited: PlainDescriptor<Anonymize<I24s4g6gkj5oec>>;
    /**
     *Some funds are locked
     */
    LockSet: PlainDescriptor<Anonymize<Ibmagsilt697o6>>;
    /**
     *Some locked funds were unlocked
     */
    LockRemoved: PlainDescriptor<Anonymize<I73g6utvpcmklb>>;
    /**
     *Some free balance was locked.
     */
    Locked: PlainDescriptor<Anonymize<I24s4g6gkj5oec>>;
    /**
     *Some locked balance was freed.
     */
    Unlocked: PlainDescriptor<Anonymize<I24s4g6gkj5oec>>;
    /**
        
         */
    Issued: PlainDescriptor<Anonymize<Iehf2srrsvlrt4>>;
    /**
        
         */
    Rescinded: PlainDescriptor<Anonymize<Iehf2srrsvlrt4>>;
  };
  Currencies: {
    /**
     *Currency transfer success.
     */
    Transferred: PlainDescriptor<Anonymize<I82vqlr4shhaso>>;
    /**
     *Update balance success.
     */
    BalanceUpdated: PlainDescriptor<Anonymize<I24s4g6gkj5oec>>;
    /**
     *Deposit success.
     */
    Deposited: PlainDescriptor<Anonymize<I24s4g6gkj5oec>>;
    /**
     *Withdraw success.
     */
    Withdrawn: PlainDescriptor<Anonymize<I24s4g6gkj5oec>>;
  };
  Vesting: {
    /**
     *Added new vesting schedule.
     */
    VestingScheduleAdded: PlainDescriptor<Anonymize<I4uo49pmivhb33>>;
    /**
     *Claimed vesting.
     */
    Claimed: PlainDescriptor<Anonymize<Id5fm4p8lj5qgi>>;
    /**
     *Updated vesting schedules.
     */
    VestingSchedulesUpdated: PlainDescriptor<Anonymize<I4cbvqmqadhrea>>;
  };
  EVM: {
    /**
     *Ethereum events from contracts.
     */
    Log: PlainDescriptor<Anonymize<Ifmc9boeeia623>>;
    /**
     *A contract has been created at given address.
     */
    Created: PlainDescriptor<Anonymize<Itmchvgqfl28g>>;
    /**
     *A contract was attempted to be created, but the execution failed.
     */
    CreatedFailed: PlainDescriptor<Anonymize<Itmchvgqfl28g>>;
    /**
     *A contract has been executed successfully with states applied.
     */
    Executed: PlainDescriptor<Anonymize<Itmchvgqfl28g>>;
    /**
     *A contract has been executed with errors. States are reverted with only gas fees applied.
     */
    ExecutedFailed: PlainDescriptor<Anonymize<Itmchvgqfl28g>>;
  };
  Ethereum: {
    /**
     *An ethereum transaction was successfully executed.
     */
    Executed: PlainDescriptor<Anonymize<Iea4g5ovhnolus>>;
  };
  EVMAccounts: {
    /**
     *Binding was created.
     */
    Bound: PlainDescriptor<Anonymize<I8363i1h1dgh0n>>;
    /**
     *Deployer was added.
     */
    DeployerAdded: PlainDescriptor<Anonymize<Ibqjgs3foip9fb>>;
    /**
     *Deployer was removed.
     */
    DeployerRemoved: PlainDescriptor<Anonymize<Ibqjgs3foip9fb>>;
    /**
     *Contract was approved.
     */
    ContractApproved: PlainDescriptor<Anonymize<Itmchvgqfl28g>>;
    /**
     *Contract was disapproved.
     */
    ContractDisapproved: PlainDescriptor<Anonymize<Itmchvgqfl28g>>;
  };
  XYKLiquidityMining: {
    /**
     *New global farm was created.
     */
    GlobalFarmCreated: PlainDescriptor<Anonymize<I4o7otrppfgqfl>>;
    /**
     *Global farm's `price_adjustment` was updated.
     */
    GlobalFarmUpdated: PlainDescriptor<Anonymize<I4h1hamhsvt02v>>;
    /**
     *New yield farm was added into the farm.
     */
    YieldFarmCreated: PlainDescriptor<Anonymize<Ibil4nv30gc4gi>>;
    /**
     *Global farm was terminated.
     */
    GlobalFarmTerminated: PlainDescriptor<Anonymize<I8p8774nu1gec7>>;
    /**
     *New LP tokens was deposited.
     */
    SharesDeposited: PlainDescriptor<Anonymize<I2k8785n6tr14a>>;
    /**
     *LP token was redeposited for a new yield farm entry
     */
    SharesRedeposited: PlainDescriptor<Anonymize<I2k8785n6tr14a>>;
    /**
     *Rewards was claimed.
     */
    RewardClaimed: PlainDescriptor<Anonymize<I16oglmrf6q8h2>>;
    /**
     *LP tokens was withdrawn.
     */
    SharesWithdrawn: PlainDescriptor<Anonymize<I2k8785n6tr14a>>;
    /**
     *Yield farm for asset pair was stopped.
     */
    YieldFarmStopped: PlainDescriptor<Anonymize<I1mm5epgr01rv3>>;
    /**
     *Yield farm for asset pair was resumed.
     */
    YieldFarmResumed: PlainDescriptor<Anonymize<Ia4163nej70ub3>>;
    /**
     *Yield farm was terminated from global farm.
     */
    YieldFarmTerminated: PlainDescriptor<Anonymize<I1mm5epgr01rv3>>;
    /**
     *Yield farm multiplier was updated.
     */
    YieldFarmUpdated: PlainDescriptor<Anonymize<Ia4163nej70ub3>>;
    /**
     *NFT representing deposit has been destroyed
     */
    DepositDestroyed: PlainDescriptor<Anonymize<Iv3iro9hpdvcu>>;
  };
  XYKWarehouseLM: {
    /**
     *Global farm accumulated reward per share was updated.
     */
    GlobalFarmAccRPZUpdated: PlainDescriptor<Anonymize<I4qeb32vu4p1o2>>;
    /**
     *Yield farm accumulated reward per valued share was updated.
     */
    YieldFarmAccRPVSUpdated: PlainDescriptor<Anonymize<Icatb69nkfsv2d>>;
    /**
     *Global farm has no more rewards to distribute in the moment.
     */
    AllRewardsDistributed: PlainDescriptor<Anonymize<I9q8qmop6bko5m>>;
  };
  RelayChainInfo: {
    /**
     *Current block numbers
     *[ Parachain block number, Relaychain Block number ]
     */
    CurrentBlockNumbers: PlainDescriptor<Anonymize<Iec641q1s1ifm2>>;
  };
  DCA: {
    /**
     *The DCA execution is started
     */
    ExecutionStarted: PlainDescriptor<Anonymize<I4rrqp6atse8pe>>;
    /**
     *The DCA is scheduled for next execution
     */
    Scheduled: PlainDescriptor<Anonymize<I17mdck5880djt>>;
    /**
     *The DCA is planned for blocknumber
     */
    ExecutionPlanned: PlainDescriptor<Anonymize<I140nraqvlukpk>>;
    /**
     *Deprecated. Use pallet_amm::Event::Swapped instead.
     *The DCA trade is successfully executed
     */
    TradeExecuted: PlainDescriptor<Anonymize<Irs8utdvl0ftp>>;
    /**
     *The DCA trade execution is failed
     */
    TradeFailed: PlainDescriptor<Anonymize<Ib2ojij8i8r7vn>>;
    /**
     *The DCA is terminated and completely removed from the chain
     */
    Terminated: PlainDescriptor<Anonymize<Ib2ojij8i8r7vn>>;
    /**
     *The DCA is completed and completely removed from the chain
     */
    Completed: PlainDescriptor<Anonymize<Iumh462jqskl8>>;
    /**
     *Randomness generation failed possibly coming from missing data about relay chain
     */
    RandomnessGenerationFailed: PlainDescriptor<Anonymize<I88onmld8ptm2c>>;
  };
  Scheduler: {
    /**
     *Scheduled some task.
     */
    Scheduled: PlainDescriptor<Anonymize<I5n4sebgkfr760>>;
    /**
     *Canceled some task.
     */
    Canceled: PlainDescriptor<Anonymize<I5n4sebgkfr760>>;
    /**
     *Dispatched some task.
     */
    Dispatched: PlainDescriptor<Anonymize<I91fqhmftmm9on>>;
    /**
     *Set a retry configuration for some task.
     */
    RetrySet: PlainDescriptor<Anonymize<Ia3c82eadg79bj>>;
    /**
     *Cancel a retry configuration for some task.
     */
    RetryCancelled: PlainDescriptor<Anonymize<Ienusoeb625ftq>>;
    /**
     *The call for the provided hash was not found so the task has been aborted.
     */
    CallUnavailable: PlainDescriptor<Anonymize<Ienusoeb625ftq>>;
    /**
     *The given task was unable to be renewed since the agenda is full at that block.
     */
    PeriodicFailed: PlainDescriptor<Anonymize<Ienusoeb625ftq>>;
    /**
     *The given task was unable to be retried since the agenda is full at that block or there
     *was not enough weight to reschedule it.
     */
    RetryFailed: PlainDescriptor<Anonymize<Ienusoeb625ftq>>;
    /**
     *The given task can never be executed since it is overweight.
     */
    PermanentlyOverweight: PlainDescriptor<Anonymize<Ienusoeb625ftq>>;
  };
  ParachainSystem: {
    /**
     *The validation function has been scheduled to apply.
     */
    ValidationFunctionStored: PlainDescriptor<undefined>;
    /**
     *The validation function was applied as of the contained relay chain block number.
     */
    ValidationFunctionApplied: PlainDescriptor<Anonymize<Idd7hd99u0ho0n>>;
    /**
     *The relay-chain aborted the upgrade process.
     */
    ValidationFunctionDiscarded: PlainDescriptor<undefined>;
    /**
     *Some downward messages have been received and will be processed.
     */
    DownwardMessagesReceived: PlainDescriptor<Anonymize<Iafscmv8tjf0ou>>;
    /**
     *Downward messages were processed using the given weight.
     */
    DownwardMessagesProcessed: PlainDescriptor<Anonymize<I100l07kaehdlp>>;
    /**
     *An upward message was sent to the relay chain.
     */
    UpwardMessageSent: PlainDescriptor<Anonymize<I6gnbnvip5vvdi>>;
  };
  PolkadotXcm: {
    /**
     *Execution of an XCM message was attempted.
     */
    Attempted: PlainDescriptor<Anonymize<I2aatv5i0cb96a>>;
    /**
     *A XCM message was sent.
     */
    Sent: PlainDescriptor<Anonymize<Ib9msr5sr8t3dn>>;
    /**
     *Query response received which does not match a registered query. This may be because a
     *matching query was never registered, it may be because it is a duplicate response, or
     *because the query timed out.
     */
    UnexpectedResponse: PlainDescriptor<Anonymize<I3le5tr7ugg6l2>>;
    /**
     *Query response has been received and is ready for taking with `take_response`. There is
     *no registered notification call.
     */
    ResponseReady: PlainDescriptor<Anonymize<I3iun9sig164po>>;
    /**
     *Query response has been received and query is removed. The registered notification has
     *been dispatched and executed successfully.
     */
    Notified: PlainDescriptor<Anonymize<I2uqmls7kcdnii>>;
    /**
     *Query response has been received and query is removed. The registered notification
     *could not be dispatched because the dispatch weight is greater than the maximum weight
     *originally budgeted by this runtime for the query result.
     */
    NotifyOverweight: PlainDescriptor<Anonymize<Idg69klialbkb8>>;
    /**
     *Query response has been received and query is removed. There was a general error with
     *dispatching the notification call.
     */
    NotifyDispatchError: PlainDescriptor<Anonymize<I2uqmls7kcdnii>>;
    /**
     *Query response has been received and query is removed. The dispatch was unable to be
     *decoded into a `Call`; this might be due to dispatch function having a signature which
     *is not `(origin, QueryId, Response)`.
     */
    NotifyDecodeFailed: PlainDescriptor<Anonymize<I2uqmls7kcdnii>>;
    /**
     *Expected query response has been received but the origin location of the response does
     *not match that expected. The query remains registered for a later, valid, response to
     *be received and acted upon.
     */
    InvalidResponder: PlainDescriptor<Anonymize<I13jboebjcbglr>>;
    /**
     *Expected query response has been received but the expected origin location placed in
     *storage by this runtime previously cannot be decoded. The query remains registered.
     *
     *This is unexpected (since a location placed in storage in a previously executing
     *runtime should be readable prior to query timeout) and dangerous since the possibly
     *valid response will be dropped. Manual governance intervention is probably going to be
     *needed.
     */
    InvalidResponderVersion: PlainDescriptor<Anonymize<I3le5tr7ugg6l2>>;
    /**
     *Received query response has been read and removed.
     */
    ResponseTaken: PlainDescriptor<Anonymize<I30pg328m00nr3>>;
    /**
     *Some assets have been placed in an asset trap.
     */
    AssetsTrapped: PlainDescriptor<Anonymize<I381dkhrurdhrs>>;
    /**
     *An XCM version change notification message has been attempted to be sent.
     *
     *The cost of sending it (borne by the chain) is included.
     */
    VersionChangeNotified: PlainDescriptor<Anonymize<Ic8hi3qr11vngc>>;
    /**
     *The supported version of a location has been changed. This might be through an
     *automatic notification or a manual intervention.
     */
    SupportedVersionChanged: PlainDescriptor<Anonymize<Iabk8ljl5g8c86>>;
    /**
     *A given location which had a version change subscription was dropped owing to an error
     *sending the notification to it.
     */
    NotifyTargetSendFail: PlainDescriptor<Anonymize<Ibjdlecumfu7q7>>;
    /**
     *A given location which had a version change subscription was dropped owing to an error
     *migrating the location to our new XCM format.
     */
    NotifyTargetMigrationFail: PlainDescriptor<Anonymize<Ia9ems1kg7laoc>>;
    /**
     *Expected query response has been received but the expected querier location placed in
     *storage by this runtime previously cannot be decoded. The query remains registered.
     *
     *This is unexpected (since a location placed in storage in a previously executing
     *runtime should be readable prior to query timeout) and dangerous since the possibly
     *valid response will be dropped. Manual governance intervention is probably going to be
     *needed.
     */
    InvalidQuerierVersion: PlainDescriptor<Anonymize<I3le5tr7ugg6l2>>;
    /**
     *Expected query response has been received but the querier location of the response does
     *not match the expected. The query remains registered for a later, valid, response to
     *be received and acted upon.
     */
    InvalidQuerier: PlainDescriptor<Anonymize<I92fq0fa45vi3>>;
    /**
     *A remote has requested XCM version change notification from us and we have honored it.
     *A version information message is sent to them and its cost is included.
     */
    VersionNotifyStarted: PlainDescriptor<Anonymize<Id01dpp0dn2cj0>>;
    /**
     *We have requested that a remote chain send us XCM version change notifications.
     */
    VersionNotifyRequested: PlainDescriptor<Anonymize<Id01dpp0dn2cj0>>;
    /**
     *We have requested that a remote chain stops sending us XCM version change
     *notifications.
     */
    VersionNotifyUnrequested: PlainDescriptor<Anonymize<Id01dpp0dn2cj0>>;
    /**
     *Fees were paid from a location for an operation (often for using `SendXcm`).
     */
    FeesPaid: PlainDescriptor<Anonymize<I6nu8k62ck9o8o>>;
    /**
     *Some assets have been claimed from an asset trap
     */
    AssetsClaimed: PlainDescriptor<Anonymize<I381dkhrurdhrs>>;
    /**
     *A XCM version migration finished.
     */
    VersionMigrationFinished: PlainDescriptor<Anonymize<I6s1nbislhk619>>;
  };
  CumulusXcm: {
    /**
     *Downward message is invalid XCM.
     *\[ id \]
     */
    InvalidFormat: PlainDescriptor<FixedSizeBinary<32>>;
    /**
     *Downward message is unsupported version of XCM.
     *\[ id \]
     */
    UnsupportedVersion: PlainDescriptor<FixedSizeBinary<32>>;
    /**
     *Downward message executed with the given outcome.
     *\[ id, outcome \]
     */
    ExecutedDownward: PlainDescriptor<Anonymize<Iea25i7vqm7ot3>>;
  };
  XcmpQueue: {
    /**
     *An HRMP message was sent to a sibling parachain.
     */
    XcmpMessageSent: PlainDescriptor<Anonymize<I137t1cld92pod>>;
  };
  MessageQueue: {
    /**
     *Message discarded due to an error in the `MessageProcessor` (usually a format error).
     */
    ProcessingFailed: PlainDescriptor<Anonymize<I3vs6qhrit34fa>>;
    /**
     *Message is processed.
     */
    Processed: PlainDescriptor<Anonymize<Ia3uu7lqcc1q1i>>;
    /**
     *Message placed in overweight queue.
     */
    OverweightEnqueued: PlainDescriptor<Anonymize<I7crucfnonitkn>>;
    /**
     *This page was reaped.
     */
    PageReaped: PlainDescriptor<Anonymize<I7tmrp94r9sq4n>>;
  };
  OrmlXcm: {
    /**
     *XCM message sent. \[to, message\]
     */
    Sent: PlainDescriptor<Anonymize<Id3ajno3thjgec>>;
  };
  XTokens: {
    /**
     *Transferred `Asset` with fee.
     */
    TransferredAssets: PlainDescriptor<Anonymize<Ic04t5m0ihvrp5>>;
  };
  UnknownTokens: {
    /**
     *Deposit success.
     */
    Deposited: PlainDescriptor<Anonymize<I7id9rd759h17f>>;
    /**
     *Withdraw success.
     */
    Withdrawn: PlainDescriptor<Anonymize<I7id9rd759h17f>>;
  };
  CollatorSelection: {
    /**
     *New Invulnerables were set.
     */
    NewInvulnerables: PlainDescriptor<Anonymize<I39t01nnod9109>>;
    /**
     *A new Invulnerable was added.
     */
    InvulnerableAdded: PlainDescriptor<Anonymize<I6v8sm60vvkmk7>>;
    /**
     *An Invulnerable was removed.
     */
    InvulnerableRemoved: PlainDescriptor<Anonymize<I6v8sm60vvkmk7>>;
    /**
     *The number of desired candidates was set.
     */
    NewDesiredCandidates: PlainDescriptor<Anonymize<I1qmtmbe5so8r3>>;
    /**
     *The candidacy bond was set.
     */
    NewCandidacyBond: PlainDescriptor<Anonymize<Ih99m6ehpcar7>>;
    /**
     *A new candidate joined.
     */
    CandidateAdded: PlainDescriptor<Anonymize<Idgorhsbgdq2ap>>;
    /**
     *Bond of a candidate updated.
     */
    CandidateBondUpdated: PlainDescriptor<Anonymize<Idgorhsbgdq2ap>>;
    /**
     *A candidate was removed.
     */
    CandidateRemoved: PlainDescriptor<Anonymize<I6v8sm60vvkmk7>>;
    /**
     *An account was replaced in the candidate list by another one.
     */
    CandidateReplaced: PlainDescriptor<Anonymize<I9ubb2kqevnu6t>>;
    /**
     *An account was unable to be added to the Invulnerables because they did not have keys
     *registered. Other Invulnerables may have been set.
     */
    InvalidInvulnerableSkipped: PlainDescriptor<Anonymize<I6v8sm60vvkmk7>>;
  };
  Session: {
    /**
     *New session has happened. Note that the argument is the session index, not the
     *block number as the type might suggest.
     */
    NewSession: PlainDescriptor<Anonymize<I2hq50pu2kdjpo>>;
  };
  EmaOracle: {
    /**
     *Oracle was added to the whitelist.
     */
    AddedToWhitelist: PlainDescriptor<Anonymize<Iabgdocrka40v9>>;
    /**
     *Oracle was removed from the whitelist.
     */
    RemovedFromWhitelist: PlainDescriptor<Anonymize<Iabgdocrka40v9>>;
  };
  Broadcast: {
    /**
     *Trade executed.
     */
    Swapped: PlainDescriptor<Anonymize<Ieud99mk6qrhbc>>;
  };
};
type IError = {
  System: {
    /**
     *The name of specification does not match between the current runtime
     *and the new runtime.
     */
    InvalidSpecName: PlainDescriptor<undefined>;
    /**
     *The specification version is not allowed to decrease between the current runtime
     *and the new runtime.
     */
    SpecVersionNeedsToIncrease: PlainDescriptor<undefined>;
    /**
     *Failed to extract the runtime version from the new runtime.
     *
     *Either calling `Core_version` or decoding `RuntimeVersion` failed.
     */
    FailedToExtractRuntimeVersion: PlainDescriptor<undefined>;
    /**
     *Suicide called when the account has non-default composite data.
     */
    NonDefaultComposite: PlainDescriptor<undefined>;
    /**
     *There is a non-zero reference count preventing the account from being purged.
     */
    NonZeroRefCount: PlainDescriptor<undefined>;
    /**
     *The origin filter prevent the call to be dispatched.
     */
    CallFiltered: PlainDescriptor<undefined>;
    /**
     *A multi-block migration is ongoing and prevents the current code from being replaced.
     */
    MultiBlockMigrationsOngoing: PlainDescriptor<undefined>;
    /**
     *No upgrade authorized.
     */
    NothingAuthorized: PlainDescriptor<undefined>;
    /**
     *The submitted code is not authorized.
     */
    Unauthorized: PlainDescriptor<undefined>;
  };
  Balances: {
    /**
     *Vesting balance too high to send value.
     */
    VestingBalance: PlainDescriptor<undefined>;
    /**
     *Account liquidity restrictions prevent withdrawal.
     */
    LiquidityRestrictions: PlainDescriptor<undefined>;
    /**
     *Balance too low to send value.
     */
    InsufficientBalance: PlainDescriptor<undefined>;
    /**
     *Value too low to create account due to existential deposit.
     */
    ExistentialDeposit: PlainDescriptor<undefined>;
    /**
     *Transfer/payment would kill account.
     */
    Expendability: PlainDescriptor<undefined>;
    /**
     *A vesting schedule already exists for this account.
     */
    ExistingVestingSchedule: PlainDescriptor<undefined>;
    /**
     *Beneficiary account must pre-exist.
     */
    DeadAccount: PlainDescriptor<undefined>;
    /**
     *Number of named reserves exceed `MaxReserves`.
     */
    TooManyReserves: PlainDescriptor<undefined>;
    /**
     *Number of holds exceed `VariantCountOf<T::RuntimeHoldReason>`.
     */
    TooManyHolds: PlainDescriptor<undefined>;
    /**
     *Number of freezes exceed `MaxFreezes`.
     */
    TooManyFreezes: PlainDescriptor<undefined>;
    /**
     *The issuance cannot be modified since it is already deactivated.
     */
    IssuanceDeactivated: PlainDescriptor<undefined>;
    /**
     *The delta cannot be zero.
     */
    DeltaZero: PlainDescriptor<undefined>;
  };
  MultiTransactionPayment: {
    /**
     *Selected currency is not supported.
     */
    UnsupportedCurrency: PlainDescriptor<undefined>;
    /**
     *Account balance should be non-zero.
     */
    ZeroBalance: PlainDescriptor<undefined>;
    /**
     *Currency is already in the list of accepted currencies.
     */
    AlreadyAccepted: PlainDescriptor<undefined>;
    /**
     *It is not allowed to add Core Asset as accepted currency. Core asset is accepted by design.
     */
    CoreAssetNotAllowed: PlainDescriptor<undefined>;
    /**
     *Fallback price cannot be zero.
     */
    ZeroPrice: PlainDescriptor<undefined>;
    /**
     *Fallback price was not found.
     */
    FallbackPriceNotFound: PlainDescriptor<undefined>;
    /**
     *Math overflow
     */
    Overflow: PlainDescriptor<undefined>;
    /**
     *It is not allowed to change payment currency of an EVM account.
     */
    EvmAccountNotAllowed: PlainDescriptor<undefined>;
    /**
     *EVM permit expired.
     */
    EvmPermitExpired: PlainDescriptor<undefined>;
    /**
     *EVM permit is invalid.
     */
    EvmPermitInvalid: PlainDescriptor<undefined>;
    /**
     *EVM permit call failed.
     */
    EvmPermitCallExecutionError: PlainDescriptor<undefined>;
    /**
     *EVM permit call failed.
     */
    EvmPermitRunnerError: PlainDescriptor<undefined>;
  };
  Treasury: {
    /**
     *Proposer's balance is too low.
     */
    InsufficientProposersBalance: PlainDescriptor<undefined>;
    /**
     *No proposal, bounty or spend at that index.
     */
    InvalidIndex: PlainDescriptor<undefined>;
    /**
     *Too many approvals in the queue.
     */
    TooManyApprovals: PlainDescriptor<undefined>;
    /**
     *The spend origin is valid but the amount it is allowed to spend is lower than the
     *amount to be spent.
     */
    InsufficientPermission: PlainDescriptor<undefined>;
    /**
     *Proposal has not been approved.
     */
    ProposalNotApproved: PlainDescriptor<undefined>;
    /**
     *The balance of the asset kind is not convertible to the balance of the native asset.
     */
    FailedToConvertBalance: PlainDescriptor<undefined>;
    /**
     *The spend has expired and cannot be claimed.
     */
    SpendExpired: PlainDescriptor<undefined>;
    /**
     *The spend is not yet eligible for payout.
     */
    EarlyPayout: PlainDescriptor<undefined>;
    /**
     *The payment has already been attempted.
     */
    AlreadyAttempted: PlainDescriptor<undefined>;
    /**
     *There was some issue with the mechanism of payment.
     */
    PayoutError: PlainDescriptor<undefined>;
    /**
     *The payout was not yet attempted/claimed.
     */
    NotAttempted: PlainDescriptor<undefined>;
    /**
     *The payment has neither failed nor succeeded yet.
     */
    Inconclusive: PlainDescriptor<undefined>;
  };
  Utility: {
    /**
     *Too many calls batched.
     */
    TooManyCalls: PlainDescriptor<undefined>;
  };
  Preimage: {
    /**
     *Preimage is too large to store on-chain.
     */
    TooBig: PlainDescriptor<undefined>;
    /**
     *Preimage has already been noted on-chain.
     */
    AlreadyNoted: PlainDescriptor<undefined>;
    /**
     *The user is not authorized to perform this action.
     */
    NotAuthorized: PlainDescriptor<undefined>;
    /**
     *The preimage cannot be removed since it has not yet been noted.
     */
    NotNoted: PlainDescriptor<undefined>;
    /**
     *A preimage may not be removed when there are outstanding requests.
     */
    Requested: PlainDescriptor<undefined>;
    /**
     *The preimage request cannot be removed since no outstanding requests exist.
     */
    NotRequested: PlainDescriptor<undefined>;
    /**
     *More than `MAX_HASH_UPGRADE_BULK_COUNT` hashes were requested to be upgraded at once.
     */
    TooMany: PlainDescriptor<undefined>;
    /**
     *Too few hashes were requested to be upgraded (i.e. zero).
     */
    TooFew: PlainDescriptor<undefined>;
  };
  Identity: {
    /**
     *Too many subs-accounts.
     */
    TooManySubAccounts: PlainDescriptor<undefined>;
    /**
     *Account isn't found.
     */
    NotFound: PlainDescriptor<undefined>;
    /**
     *Account isn't named.
     */
    NotNamed: PlainDescriptor<undefined>;
    /**
     *Empty index.
     */
    EmptyIndex: PlainDescriptor<undefined>;
    /**
     *Fee is changed.
     */
    FeeChanged: PlainDescriptor<undefined>;
    /**
     *No identity found.
     */
    NoIdentity: PlainDescriptor<undefined>;
    /**
     *Sticky judgement.
     */
    StickyJudgement: PlainDescriptor<undefined>;
    /**
     *Judgement given.
     */
    JudgementGiven: PlainDescriptor<undefined>;
    /**
     *Invalid judgement.
     */
    InvalidJudgement: PlainDescriptor<undefined>;
    /**
     *The index is invalid.
     */
    InvalidIndex: PlainDescriptor<undefined>;
    /**
     *The target is invalid.
     */
    InvalidTarget: PlainDescriptor<undefined>;
    /**
     *Maximum amount of registrars reached. Cannot add any more.
     */
    TooManyRegistrars: PlainDescriptor<undefined>;
    /**
     *Account ID is already named.
     */
    AlreadyClaimed: PlainDescriptor<undefined>;
    /**
     *Sender is not a sub-account.
     */
    NotSub: PlainDescriptor<undefined>;
    /**
     *Sub-account isn't owned by sender.
     */
    NotOwned: PlainDescriptor<undefined>;
    /**
     *The provided judgement was for a different identity.
     */
    JudgementForDifferentIdentity: PlainDescriptor<undefined>;
    /**
     *Error that occurs when there is an issue paying for judgement.
     */
    JudgementPaymentFailed: PlainDescriptor<undefined>;
    /**
     *The provided suffix is too long.
     */
    InvalidSuffix: PlainDescriptor<undefined>;
    /**
     *The sender does not have permission to issue a username.
     */
    NotUsernameAuthority: PlainDescriptor<undefined>;
    /**
     *The authority cannot allocate any more usernames.
     */
    NoAllocation: PlainDescriptor<undefined>;
    /**
     *The signature on a username was not valid.
     */
    InvalidSignature: PlainDescriptor<undefined>;
    /**
     *Setting this username requires a signature, but none was provided.
     */
    RequiresSignature: PlainDescriptor<undefined>;
    /**
     *The username does not meet the requirements.
     */
    InvalidUsername: PlainDescriptor<undefined>;
    /**
     *The username is already taken.
     */
    UsernameTaken: PlainDescriptor<undefined>;
    /**
     *The requested username does not exist.
     */
    NoUsername: PlainDescriptor<undefined>;
    /**
     *The username cannot be forcefully removed because it can still be accepted.
     */
    NotExpired: PlainDescriptor<undefined>;
  };
  Democracy: {
    /**
     *Value too low
     */
    ValueLow: PlainDescriptor<undefined>;
    /**
     *Proposal does not exist
     */
    ProposalMissing: PlainDescriptor<undefined>;
    /**
     *Cannot cancel the same proposal twice
     */
    AlreadyCanceled: PlainDescriptor<undefined>;
    /**
     *Proposal already made
     */
    DuplicateProposal: PlainDescriptor<undefined>;
    /**
     *Proposal still blacklisted
     */
    ProposalBlacklisted: PlainDescriptor<undefined>;
    /**
     *Next external proposal not simple majority
     */
    NotSimpleMajority: PlainDescriptor<undefined>;
    /**
     *Invalid hash
     */
    InvalidHash: PlainDescriptor<undefined>;
    /**
     *No external proposal
     */
    NoProposal: PlainDescriptor<undefined>;
    /**
     *Identity may not veto a proposal twice
     */
    AlreadyVetoed: PlainDescriptor<undefined>;
    /**
     *Vote given for invalid referendum
     */
    ReferendumInvalid: PlainDescriptor<undefined>;
    /**
     *No proposals waiting
     */
    NoneWaiting: PlainDescriptor<undefined>;
    /**
     *The given account did not vote on the referendum.
     */
    NotVoter: PlainDescriptor<undefined>;
    /**
     *The actor has no permission to conduct the action.
     */
    NoPermission: PlainDescriptor<undefined>;
    /**
     *The account is already delegating.
     */
    AlreadyDelegating: PlainDescriptor<undefined>;
    /**
     *Too high a balance was provided that the account cannot afford.
     */
    InsufficientFunds: PlainDescriptor<undefined>;
    /**
     *The account is not currently delegating.
     */
    NotDelegating: PlainDescriptor<undefined>;
    /**
     *The account currently has votes attached to it and the operation cannot succeed until
     *these are removed, either through `unvote` or `reap_vote`.
     */
    VotesExist: PlainDescriptor<undefined>;
    /**
     *The instant referendum origin is currently disallowed.
     */
    InstantNotAllowed: PlainDescriptor<undefined>;
    /**
     *Delegation to oneself makes no sense.
     */
    Nonsense: PlainDescriptor<undefined>;
    /**
     *Invalid upper bound.
     */
    WrongUpperBound: PlainDescriptor<undefined>;
    /**
     *Maximum number of votes reached.
     */
    MaxVotesReached: PlainDescriptor<undefined>;
    /**
     *Maximum number of items reached.
     */
    TooMany: PlainDescriptor<undefined>;
    /**
     *Voting period too low
     */
    VotingPeriodLow: PlainDescriptor<undefined>;
    /**
     *The preimage does not exist.
     */
    PreimageNotExist: PlainDescriptor<undefined>;
  };
  Elections: {
    /**
     *Cannot vote when no candidates or members exist.
     */
    UnableToVote: PlainDescriptor<undefined>;
    /**
     *Must vote for at least one candidate.
     */
    NoVotes: PlainDescriptor<undefined>;
    /**
     *Cannot vote more than candidates.
     */
    TooManyVotes: PlainDescriptor<undefined>;
    /**
     *Cannot vote more than maximum allowed.
     */
    MaximumVotesExceeded: PlainDescriptor<undefined>;
    /**
     *Cannot vote with stake less than minimum balance.
     */
    LowBalance: PlainDescriptor<undefined>;
    /**
     *Voter can not pay voting bond.
     */
    UnableToPayBond: PlainDescriptor<undefined>;
    /**
     *Must be a voter.
     */
    MustBeVoter: PlainDescriptor<undefined>;
    /**
     *Duplicated candidate submission.
     */
    DuplicatedCandidate: PlainDescriptor<undefined>;
    /**
     *Too many candidates have been created.
     */
    TooManyCandidates: PlainDescriptor<undefined>;
    /**
     *Member cannot re-submit candidacy.
     */
    MemberSubmit: PlainDescriptor<undefined>;
    /**
     *Runner cannot re-submit candidacy.
     */
    RunnerUpSubmit: PlainDescriptor<undefined>;
    /**
     *Candidate does not have enough funds.
     */
    InsufficientCandidateFunds: PlainDescriptor<undefined>;
    /**
     *Not a member.
     */
    NotMember: PlainDescriptor<undefined>;
    /**
     *The provided count of number of candidates is incorrect.
     */
    InvalidWitnessData: PlainDescriptor<undefined>;
    /**
     *The provided count of number of votes is incorrect.
     */
    InvalidVoteCount: PlainDescriptor<undefined>;
    /**
     *The renouncing origin presented a wrong `Renouncing` parameter.
     */
    InvalidRenouncing: PlainDescriptor<undefined>;
    /**
     *Prediction regarding replacement after member removal is wrong.
     */
    InvalidReplacement: PlainDescriptor<undefined>;
  };
  Council: {
    /**
     *Account is not a member
     */
    NotMember: PlainDescriptor<undefined>;
    /**
     *Duplicate proposals not allowed
     */
    DuplicateProposal: PlainDescriptor<undefined>;
    /**
     *Proposal must exist
     */
    ProposalMissing: PlainDescriptor<undefined>;
    /**
     *Mismatched index
     */
    WrongIndex: PlainDescriptor<undefined>;
    /**
     *Duplicate vote ignored
     */
    DuplicateVote: PlainDescriptor<undefined>;
    /**
     *Members are already initialized!
     */
    AlreadyInitialized: PlainDescriptor<undefined>;
    /**
     *The close call was made too early, before the end of the voting.
     */
    TooEarly: PlainDescriptor<undefined>;
    /**
     *There can only be a maximum of `MaxProposals` active proposals.
     */
    TooManyProposals: PlainDescriptor<undefined>;
    /**
     *The given weight bound for the proposal was too low.
     */
    WrongProposalWeight: PlainDescriptor<undefined>;
    /**
     *The given length bound for the proposal was too low.
     */
    WrongProposalLength: PlainDescriptor<undefined>;
    /**
     *Prime account is not a member
     */
    PrimeAccountNotMember: PlainDescriptor<undefined>;
  };
  TechnicalCommittee: {
    /**
     *Account is not a member
     */
    NotMember: PlainDescriptor<undefined>;
    /**
     *Duplicate proposals not allowed
     */
    DuplicateProposal: PlainDescriptor<undefined>;
    /**
     *Proposal must exist
     */
    ProposalMissing: PlainDescriptor<undefined>;
    /**
     *Mismatched index
     */
    WrongIndex: PlainDescriptor<undefined>;
    /**
     *Duplicate vote ignored
     */
    DuplicateVote: PlainDescriptor<undefined>;
    /**
     *Members are already initialized!
     */
    AlreadyInitialized: PlainDescriptor<undefined>;
    /**
     *The close call was made too early, before the end of the voting.
     */
    TooEarly: PlainDescriptor<undefined>;
    /**
     *There can only be a maximum of `MaxProposals` active proposals.
     */
    TooManyProposals: PlainDescriptor<undefined>;
    /**
     *The given weight bound for the proposal was too low.
     */
    WrongProposalWeight: PlainDescriptor<undefined>;
    /**
     *The given length bound for the proposal was too low.
     */
    WrongProposalLength: PlainDescriptor<undefined>;
    /**
     *Prime account is not a member
     */
    PrimeAccountNotMember: PlainDescriptor<undefined>;
  };
  Tips: {
    /**
     *The reason given is just too big.
     */
    ReasonTooBig: PlainDescriptor<undefined>;
    /**
     *The tip was already found/started.
     */
    AlreadyKnown: PlainDescriptor<undefined>;
    /**
     *The tip hash is unknown.
     */
    UnknownTip: PlainDescriptor<undefined>;
    /**
     *The tip given was too generous.
     */
    MaxTipAmountExceeded: PlainDescriptor<undefined>;
    /**
     *The account attempting to retract the tip is not the finder of the tip.
     */
    NotFinder: PlainDescriptor<undefined>;
    /**
     *The tip cannot be claimed/closed because there are not enough tippers yet.
     */
    StillOpen: PlainDescriptor<undefined>;
    /**
     *The tip cannot be claimed/closed because it's still in the countdown period.
     */
    Premature: PlainDescriptor<undefined>;
  };
  Proxy: {
    /**
     *There are too many proxies registered or too many announcements pending.
     */
    TooMany: PlainDescriptor<undefined>;
    /**
     *Proxy registration not found.
     */
    NotFound: PlainDescriptor<undefined>;
    /**
     *Sender is not a proxy of the account to be proxied.
     */
    NotProxy: PlainDescriptor<undefined>;
    /**
     *A call which is incompatible with the proxy type's filter was attempted.
     */
    Unproxyable: PlainDescriptor<undefined>;
    /**
     *Account is already a proxy.
     */
    Duplicate: PlainDescriptor<undefined>;
    /**
     *Call may not be made by proxy because it may escalate its privileges.
     */
    NoPermission: PlainDescriptor<undefined>;
    /**
     *Announcement, if made at all, was made too recently.
     */
    Unannounced: PlainDescriptor<undefined>;
    /**
     *Cannot add self as proxy.
     */
    NoSelfProxy: PlainDescriptor<undefined>;
  };
  Multisig: {
    /**
     *Threshold must be 2 or greater.
     */
    MinimumThreshold: PlainDescriptor<undefined>;
    /**
     *Call is already approved by this signatory.
     */
    AlreadyApproved: PlainDescriptor<undefined>;
    /**
     *Call doesn't need any (more) approvals.
     */
    NoApprovalsNeeded: PlainDescriptor<undefined>;
    /**
     *There are too few signatories in the list.
     */
    TooFewSignatories: PlainDescriptor<undefined>;
    /**
     *There are too many signatories in the list.
     */
    TooManySignatories: PlainDescriptor<undefined>;
    /**
     *The signatories were provided out of order; they should be ordered.
     */
    SignatoriesOutOfOrder: PlainDescriptor<undefined>;
    /**
     *The sender was contained in the other signatories; it shouldn't be.
     */
    SenderInSignatories: PlainDescriptor<undefined>;
    /**
     *Multisig operation not found when attempting to cancel.
     */
    NotFound: PlainDescriptor<undefined>;
    /**
     *Only the account that originally created the multisig is able to cancel it.
     */
    NotOwner: PlainDescriptor<undefined>;
    /**
     *No timepoint was given, yet the multisig operation is already underway.
     */
    NoTimepoint: PlainDescriptor<undefined>;
    /**
     *A different timepoint was given to the multisig operation that is underway.
     */
    WrongTimepoint: PlainDescriptor<undefined>;
    /**
     *A timepoint was given, yet no multisig operation is underway.
     */
    UnexpectedTimepoint: PlainDescriptor<undefined>;
    /**
     *The maximum weight information provided was too low.
     */
    MaxWeightTooLow: PlainDescriptor<undefined>;
    /**
     *The data to be stored is already stored.
     */
    AlreadyStored: PlainDescriptor<undefined>;
  };
  Uniques: {
    /**
     *The signing account has no permission to do the operation.
     */
    NoPermission: PlainDescriptor<undefined>;
    /**
     *The given item ID is unknown.
     */
    UnknownCollection: PlainDescriptor<undefined>;
    /**
     *The item ID has already been used for an item.
     */
    AlreadyExists: PlainDescriptor<undefined>;
    /**
     *The owner turned out to be different to what was expected.
     */
    WrongOwner: PlainDescriptor<undefined>;
    /**
     *Invalid witness data given.
     */
    BadWitness: PlainDescriptor<undefined>;
    /**
     *The item ID is already taken.
     */
    InUse: PlainDescriptor<undefined>;
    /**
     *The item or collection is frozen.
     */
    Frozen: PlainDescriptor<undefined>;
    /**
     *The delegate turned out to be different to what was expected.
     */
    WrongDelegate: PlainDescriptor<undefined>;
    /**
     *There is no delegate approved.
     */
    NoDelegate: PlainDescriptor<undefined>;
    /**
     *No approval exists that would allow the transfer.
     */
    Unapproved: PlainDescriptor<undefined>;
    /**
     *The named owner has not signed ownership of the collection is acceptable.
     */
    Unaccepted: PlainDescriptor<undefined>;
    /**
     *The item is locked.
     */
    Locked: PlainDescriptor<undefined>;
    /**
     *All items have been minted.
     */
    MaxSupplyReached: PlainDescriptor<undefined>;
    /**
     *The max supply has already been set.
     */
    MaxSupplyAlreadySet: PlainDescriptor<undefined>;
    /**
     *The provided max supply is less to the amount of items a collection already has.
     */
    MaxSupplyTooSmall: PlainDescriptor<undefined>;
    /**
     *The given item ID is unknown.
     */
    UnknownItem: PlainDescriptor<undefined>;
    /**
     *Item is not for sale.
     */
    NotForSale: PlainDescriptor<undefined>;
    /**
     *The provided bid is too low.
     */
    BidTooLow: PlainDescriptor<undefined>;
  };
  StateTrieMigration: {
    /**
     *Max signed limits not respected.
     */
    MaxSignedLimits: PlainDescriptor<undefined>;
    /**
     *A key was longer than the configured maximum.
     *
     *This means that the migration halted at the current [`Progress`] and
     *can be resumed with a larger [`crate::Config::MaxKeyLen`] value.
     *Retrying with the same [`crate::Config::MaxKeyLen`] value will not work.
     *The value should only be increased to avoid a storage migration for the currently
     *stored [`crate::Progress::LastKey`].
     */
    KeyTooLong: PlainDescriptor<undefined>;
    /**
     *submitter does not have enough funds.
     */
    NotEnoughFunds: PlainDescriptor<undefined>;
    /**
     *Bad witness data provided.
     */
    BadWitness: PlainDescriptor<undefined>;
    /**
     *Signed migration is not allowed because the maximum limit is not set yet.
     */
    SignedMigrationNotAllowed: PlainDescriptor<undefined>;
    /**
     *Bad child root provided.
     */
    BadChildRoot: PlainDescriptor<undefined>;
  };
  ConvictionVoting: {
    /**
     *Poll is not ongoing.
     */
    NotOngoing: PlainDescriptor<undefined>;
    /**
     *The given account did not vote on the poll.
     */
    NotVoter: PlainDescriptor<undefined>;
    /**
     *The actor has no permission to conduct the action.
     */
    NoPermission: PlainDescriptor<undefined>;
    /**
     *The actor has no permission to conduct the action right now but will do in the future.
     */
    NoPermissionYet: PlainDescriptor<undefined>;
    /**
     *The account is already delegating.
     */
    AlreadyDelegating: PlainDescriptor<undefined>;
    /**
     *The account currently has votes attached to it and the operation cannot succeed until
     *these are removed through `remove_vote`.
     */
    AlreadyVoting: PlainDescriptor<undefined>;
    /**
     *Too high a balance was provided that the account cannot afford.
     */
    InsufficientFunds: PlainDescriptor<undefined>;
    /**
     *The account is not currently delegating.
     */
    NotDelegating: PlainDescriptor<undefined>;
    /**
     *Delegation to oneself makes no sense.
     */
    Nonsense: PlainDescriptor<undefined>;
    /**
     *Maximum number of votes reached.
     */
    MaxVotesReached: PlainDescriptor<undefined>;
    /**
     *The class must be supplied since it is not easily determinable from the state.
     */
    ClassNeeded: PlainDescriptor<undefined>;
    /**
     *The class ID supplied is invalid.
     */
    BadClass: PlainDescriptor<undefined>;
  };
  Referenda: {
    /**
     *Referendum is not ongoing.
     */
    NotOngoing: PlainDescriptor<undefined>;
    /**
     *Referendum's decision deposit is already paid.
     */
    HasDeposit: PlainDescriptor<undefined>;
    /**
     *The track identifier given was invalid.
     */
    BadTrack: PlainDescriptor<undefined>;
    /**
     *There are already a full complement of referenda in progress for this track.
     */
    Full: PlainDescriptor<undefined>;
    /**
     *The queue of the track is empty.
     */
    QueueEmpty: PlainDescriptor<undefined>;
    /**
     *The referendum index provided is invalid in this context.
     */
    BadReferendum: PlainDescriptor<undefined>;
    /**
     *There was nothing to do in the advancement.
     */
    NothingToDo: PlainDescriptor<undefined>;
    /**
     *No track exists for the proposal origin.
     */
    NoTrack: PlainDescriptor<undefined>;
    /**
     *Any deposit cannot be refunded until after the decision is over.
     */
    Unfinished: PlainDescriptor<undefined>;
    /**
     *The deposit refunder is not the depositor.
     */
    NoPermission: PlainDescriptor<undefined>;
    /**
     *The deposit cannot be refunded since none was made.
     */
    NoDeposit: PlainDescriptor<undefined>;
    /**
     *The referendum status is invalid for this operation.
     */
    BadStatus: PlainDescriptor<undefined>;
    /**
     *The preimage does not exist.
     */
    PreimageNotExist: PlainDescriptor<undefined>;
    /**
     *The preimage is stored with a different length than the one provided.
     */
    PreimageStoredWithDifferentLength: PlainDescriptor<undefined>;
  };
  Whitelist: {
    /**
     *The preimage of the call hash could not be loaded.
     */
    UnavailablePreImage: PlainDescriptor<undefined>;
    /**
     *The call could not be decoded.
     */
    UndecodableCall: PlainDescriptor<undefined>;
    /**
     *The weight of the decoded call was higher than the witness.
     */
    InvalidCallWeightWitness: PlainDescriptor<undefined>;
    /**
     *The call was not whitelisted.
     */
    CallIsNotWhitelisted: PlainDescriptor<undefined>;
    /**
     *The call was already whitelisted; No-Op.
     */
    CallAlreadyWhitelisted: PlainDescriptor<undefined>;
  };
  AssetRegistry: {
    /**
     *Asset ID is not available. This only happens when it reaches the MAX value of given id type.
     */
    NoIdAvailable: PlainDescriptor<undefined>;
    /**
     *Invalid asset name or symbol.
     */
    AssetNotFound: PlainDescriptor<undefined>;
    /**
     *Length of name or symbol is less than min. length.
     */
    TooShort: PlainDescriptor<undefined>;
    /**
     *Asset's symbol can't contain whitespace characters .
     */
    InvalidSymbol: PlainDescriptor<undefined>;
    /**
     *Asset ID is not registered in the asset-registry.
     */
    AssetNotRegistered: PlainDescriptor<undefined>;
    /**
     *Asset is already registered.
     */
    AssetAlreadyRegistered: PlainDescriptor<undefined>;
    /**
     *Incorrect number of assets provided to create shared asset.
     */
    InvalidSharedAssetLen: PlainDescriptor<undefined>;
    /**
     *Cannot update asset location.
     */
    CannotUpdateLocation: PlainDescriptor<undefined>;
    /**
     *Selected asset id is out of reserved range.
     */
    NotInReservedRange: PlainDescriptor<undefined>;
    /**
     *Location already registered with different asset.
     */
    LocationAlreadyRegistered: PlainDescriptor<undefined>;
    /**
     *Origin is forbidden to set/update value.
     */
    Forbidden: PlainDescriptor<undefined>;
    /**
     *Balance too low.
     */
    InsufficientBalance: PlainDescriptor<undefined>;
    /**
     *Sufficient assets can't be changed to insufficient.
     */
    ForbiddenSufficiencyChange: PlainDescriptor<undefined>;
    /**
     *Asset is already banned.
     */
    AssetAlreadyBanned: PlainDescriptor<undefined>;
    /**
     *Asset is not banned.
     */
    AssetNotBanned: PlainDescriptor<undefined>;
  };
  Claims: {
    /**
     *Ethereum signature is not valid
     */
    InvalidEthereumSignature: PlainDescriptor<undefined>;
    /**
     *Claim is not valid
     */
    NoClaimOrAlreadyClaimed: PlainDescriptor<undefined>;
    /**
     *Value reached maximum and cannot be incremented further
     */
    BalanceOverflow: PlainDescriptor<undefined>;
  };
  Omnipool: {
    /**
     *Balance too low
     */
    InsufficientBalance: PlainDescriptor<undefined>;
    /**
     *Asset is already in omnipool
     */
    AssetAlreadyAdded: PlainDescriptor<undefined>;
    /**
     *Asset is not in omnipool
     */
    AssetNotFound: PlainDescriptor<undefined>;
    /**
     *Failed to add token to Omnipool due to insufficient initial liquidity.
     */
    MissingBalance: PlainDescriptor<undefined>;
    /**
     *Invalid initial asset price.
     */
    InvalidInitialAssetPrice: PlainDescriptor<undefined>;
    /**
     *Slippage protection - minimum limit has not been reached.
     */
    BuyLimitNotReached: PlainDescriptor<undefined>;
    /**
     *Slippage protection - maximum limit has been exceeded.
     */
    SellLimitExceeded: PlainDescriptor<undefined>;
    /**
     *Position has not been found.
     */
    PositionNotFound: PlainDescriptor<undefined>;
    /**
     *Insufficient shares in position
     */
    InsufficientShares: PlainDescriptor<undefined>;
    /**
     *Asset is not allowed to be traded.
     */
    NotAllowed: PlainDescriptor<undefined>;
    /**
     *Signed account is not owner of position instance.
     */
    Forbidden: PlainDescriptor<undefined>;
    /**
     *Asset weight cap has been exceeded.
     */
    AssetWeightCapExceeded: PlainDescriptor<undefined>;
    /**
     *Asset is not registered in asset registry
     */
    AssetNotRegistered: PlainDescriptor<undefined>;
    /**
     *Provided liquidity is below minimum allowed limit
     */
    InsufficientLiquidity: PlainDescriptor<undefined>;
    /**
     *Traded amount is below minimum allowed limit
     */
    InsufficientTradingAmount: PlainDescriptor<undefined>;
    /**
     *Sell or buy with same asset ids is not allowed.
     */
    SameAssetTradeNotAllowed: PlainDescriptor<undefined>;
    /**
     *LRNA update after trade results in positive value.
     */
    HubAssetUpdateError: PlainDescriptor<undefined>;
    /**
     *Imbalance results in positive value.
     */
    PositiveImbalance: PlainDescriptor<undefined>;
    /**
     *Amount of shares provided cannot be 0.
     */
    InvalidSharesAmount: PlainDescriptor<undefined>;
    /**
     *Hub asset is only allowed to be sold.
     */
    InvalidHubAssetTradableState: PlainDescriptor<undefined>;
    /**
     *Asset is not allowed to be refunded.
     */
    AssetRefundNotAllowed: PlainDescriptor<undefined>;
    /**
     *Max fraction of asset to buy has been exceeded.
     */
    MaxOutRatioExceeded: PlainDescriptor<undefined>;
    /**
     *Max fraction of asset to sell has been exceeded.
     */
    MaxInRatioExceeded: PlainDescriptor<undefined>;
    /**
     *Max allowed price difference has been exceeded.
     */
    PriceDifferenceTooHigh: PlainDescriptor<undefined>;
    /**
     *Invalid oracle price - division by zero.
     */
    InvalidOraclePrice: PlainDescriptor<undefined>;
    /**
     *Failed to calculate withdrawal fee.
     */
    InvalidWithdrawalFee: PlainDescriptor<undefined>;
    /**
     *More than allowed amount of fee has been transferred.
     */
    FeeOverdraft: PlainDescriptor<undefined>;
    /**
     *Token cannot be removed from Omnipool due to shares still owned by other users.
     */
    SharesRemaining: PlainDescriptor<undefined>;
    /**
     *Token cannot be removed from Omnipool because asset is not frozen.
     */
    AssetNotFrozen: PlainDescriptor<undefined>;
    /**
     *Calculated amount out from sell trade is zero.
     */
    ZeroAmountOut: PlainDescriptor<undefined>;
    /**
     *Existential deposit of asset is not available.
     */
    ExistentialDepositNotAvailable: PlainDescriptor<undefined>;
    /**
     *Slippage protection
     */
    SlippageLimit: PlainDescriptor<undefined>;
  };
  TransactionPause: {
    /**
     *can not pause
     */
    CannotPause: PlainDescriptor<undefined>;
    /**
     *invalid character encoding
     */
    InvalidCharacter: PlainDescriptor<undefined>;
    /**
     *pallet name or function name is too long
     */
    NameTooLong: PlainDescriptor<undefined>;
  };
  Duster: {
    /**
     *Account is excluded from dusting.
     */
    AccountBlacklisted: PlainDescriptor<undefined>;
    /**
     *Account is not present in the non-dustable list.
     */
    AccountNotBlacklisted: PlainDescriptor<undefined>;
    /**
     *The balance is zero.
     */
    ZeroBalance: PlainDescriptor<undefined>;
    /**
     *The balance is sufficient to keep account open.
     */
    BalanceSufficient: PlainDescriptor<undefined>;
    /**
     *Dust account is not set.
     */
    DustAccountNotSet: PlainDescriptor<undefined>;
    /**
     *Reserve account is not set.
     */
    ReserveAccountNotSet: PlainDescriptor<undefined>;
  };
  OmnipoolWarehouseLM: {
    /**
     *Global farm does not exist.
     */
    GlobalFarmNotFound: PlainDescriptor<undefined>;
    /**
     *Yield farm does not exist.
     */
    YieldFarmNotFound: PlainDescriptor<undefined>;
    /**
     *Multiple claims in the same period is not allowed.
     */
    DoubleClaimInPeriod: PlainDescriptor<undefined>;
    /**
     *Liquidity mining is canceled.
     */
    LiquidityMiningCanceled: PlainDescriptor<undefined>;
    /**
     *Liquidity mining is not canceled.
     */
    LiquidityMiningIsActive: PlainDescriptor<undefined>;
    /**
     *Liquidity mining is in `active` or `terminated` state and action cannot be completed.
     */
    LiquidityMiningIsNotStopped: PlainDescriptor<undefined>;
    /**
     *LP shares amount is not valid.
     */
    InvalidDepositAmount: PlainDescriptor<undefined>;
    /**
     *Account is not allowed to perform action.
     */
    Forbidden: PlainDescriptor<undefined>;
    /**
     *Yield farm multiplier can't be 0.
     */
    InvalidMultiplier: PlainDescriptor<undefined>;
    /**
     *Yield farm with given `amm_pool_id` already exists in global farm.
     */
    YieldFarmAlreadyExists: PlainDescriptor<undefined>;
    /**
     *Loyalty curve's initial reward percentage is not valid. Valid range is: [0, 1).
     */
    InvalidInitialRewardPercentage: PlainDescriptor<undefined>;
    /**
     *One or more yield farms exist in global farm.
     */
    GlobalFarmIsNotEmpty: PlainDescriptor<undefined>;
    /**
     *Farm's `incentivized_asset` is missing in provided asset pair.
     */
    MissingIncentivizedAsset: PlainDescriptor<undefined>;
    /**
     *Reward currency balance is not sufficient.
     */
    InsufficientRewardCurrencyBalance: PlainDescriptor<undefined>;
    /**
     *Blocks per period can't be 0.
     */
    InvalidBlocksPerPeriod: PlainDescriptor<undefined>;
    /**
     *Yield per period can't be 0.
     */
    InvalidYieldPerPeriod: PlainDescriptor<undefined>;
    /**
     *Total rewards is less than `MinTotalFarmRewards`.
     */
    InvalidTotalRewards: PlainDescriptor<undefined>;
    /**
     *Planned yielding periods is less than `MinPlannedYieldingPeriods`.
     */
    InvalidPlannedYieldingPeriods: PlainDescriptor<undefined>;
    /**
     *Maximum number of locks reached for deposit.
     */
    MaxEntriesPerDeposit: PlainDescriptor<undefined>;
    /**
     *Trying to lock LP shares into already locked yield farm.
     */
    DoubleLock: PlainDescriptor<undefined>;
    /**
     *Yield farm entry doesn't exist for given deposit.
     */
    YieldFarmEntryNotFound: PlainDescriptor<undefined>;
    /**
     *Max number of yield farms in global farm was reached. Global farm can't accept new
     *yield farms until some yield farm is not removed from storage.
     */
    GlobalFarmIsFull: PlainDescriptor<undefined>;
    /**
     *Invalid min. deposit was set for global farm.
     */
    InvalidMinDeposit: PlainDescriptor<undefined>;
    /**
     *Price adjustment multiplier can't be 0.
     */
    InvalidPriceAdjustment: PlainDescriptor<undefined>;
    /**
     *Account creation from id failed.
     */
    ErrorGetAccountId: PlainDescriptor<undefined>;
    /**
     *Value of deposited shares amount in reward currency is bellow min. limit.
     */
    IncorrectValuedShares: PlainDescriptor<undefined>;
    /**
     *`reward_currency` is not registered in asset registry.
     */
    RewardCurrencyNotRegistered: PlainDescriptor<undefined>;
    /**
     *`incentivized_asset` is not registered in asset registry.
     */
    IncentivizedAssetNotRegistered: PlainDescriptor<undefined>;
    /**
     *Action cannot be completed because unexpected error has occurred. This should be reported
     *to protocol maintainers.
     */
    InconsistentState: PlainDescriptor<Anonymize<Ibplkiqg5rvr3e>>;
  };
  OmnipoolLiquidityMining: {
    /**
     *Asset is not in the omnipool.
     */
    AssetNotFound: PlainDescriptor<undefined>;
    /**
     *Signed account is not owner of the deposit.
     */
    Forbidden: PlainDescriptor<undefined>;
    /**
     *Rewards to claim are 0.
     */
    ZeroClaimedRewards: PlainDescriptor<undefined>;
    /**
     *Action cannot be completed because unexpected error has occurred. This should be reported
     *to protocol maintainers.
     */
    InconsistentState: PlainDescriptor<Anonymize<Icnmrtlo128skq>>;
    /**
     *Oracle could not be found for requested assets.
     */
    OracleNotAvailable: PlainDescriptor<undefined>;
    /**
     *Oracle providing `price_adjustment` could not be found for requested assets.
     */
    PriceAdjustmentNotAvailable: PlainDescriptor<undefined>;
    /**
     *No farms specified to join
     */
    NoFarmEntriesSpecified: PlainDescriptor<undefined>;
  };
  OTC: {
    /**
     *Asset does not exist in registry
     */
    AssetNotRegistered: PlainDescriptor<undefined>;
    /**
     *Order cannot be found
     */
    OrderNotFound: PlainDescriptor<undefined>;
    /**
     *Size of order ID exceeds the bound
     */
    OrderIdOutOfBound: PlainDescriptor<undefined>;
    /**
     *Cannot partially fill an order which is not partially fillable
     */
    OrderNotPartiallyFillable: PlainDescriptor<undefined>;
    /**
     *Order amount_in and amount_out must at all times be greater than the existential deposit
     *for the asset multiplied by the ExistentialDepositMultiplier.
     *A fill order may not leave behind amounts smaller than this.
     */
    OrderAmountTooSmall: PlainDescriptor<undefined>;
    /**
     *Error with math calculations
     */
    MathError: PlainDescriptor<undefined>;
    /**
     *The caller does not have permission to complete the action
     */
    Forbidden: PlainDescriptor<undefined>;
    /**
     *Reserved amount not sufficient.
     */
    InsufficientReservedAmount: PlainDescriptor<undefined>;
  };
  CircuitBreaker: {
    /**
     *Invalid value for a limit. Limit must be non-zero.
     */
    InvalidLimitValue: PlainDescriptor<undefined>;
    /**
     *Allowed liquidity limit is not stored for asset
     */
    LiquidityLimitNotStoredForAsset: PlainDescriptor<undefined>;
    /**
     *Token trade outflow per block has been reached
     */
    TokenOutflowLimitReached: PlainDescriptor<undefined>;
    /**
     *Token trade influx per block has been reached
     */
    TokenInfluxLimitReached: PlainDescriptor<undefined>;
    /**
     *Maximum pool's liquidity limit per block has been reached
     */
    MaxLiquidityLimitPerBlockReached: PlainDescriptor<undefined>;
    /**
     *Asset is not allowed to have a limit
     */
    NotAllowed: PlainDescriptor<undefined>;
  };
  Router: {
    /**
     *The trading limit has been reached
     */
    TradingLimitReached: PlainDescriptor<undefined>;
    /**
     *The the max number of trades limit is reached
     */
    MaxTradesExceeded: PlainDescriptor<undefined>;
    /**
     *The AMM pool is not supported for executing trades
     */
    PoolNotSupported: PlainDescriptor<undefined>;
    /**
     *The user has not enough balance to execute the trade
     */
    InsufficientBalance: PlainDescriptor<undefined>;
    /**
     *The calculation of route trade amounts failed in the underlying AMM
     */
    RouteCalculationFailed: PlainDescriptor<undefined>;
    /**
     *The route is invalid
     */
    InvalidRoute: PlainDescriptor<undefined>;
    /**
     *The route update was not successful
     */
    RouteUpdateIsNotSuccessful: PlainDescriptor<undefined>;
    /**
     *Route contains assets that has no oracle data
     */
    RouteHasNoOracle: PlainDescriptor<undefined>;
    /**
     *The route execution failed in the underlying AMM
     */
    InvalidRouteExecution: PlainDescriptor<undefined>;
    /**
     *Trading same assets is not allowed.
     */
    NotAllowed: PlainDescriptor<undefined>;
  };
  Staking: {
    /**
     *Balance is too low.
     */
    InsufficientBalance: PlainDescriptor<undefined>;
    /**
     *Staked amount is too low.
     */
    InsufficientStake: PlainDescriptor<undefined>;
    /**
     *Staking position has not been found.
     */
    PositionNotFound: PlainDescriptor<undefined>;
    /**
     *Maximum amount of votes were reached for staking position.
     */
    MaxVotesReached: PlainDescriptor<undefined>;
    /**
     *Staking is not initialized.
     */
    NotInitialized: PlainDescriptor<undefined>;
    /**
     *Staking is already initialized.
     */
    AlreadyInitialized: PlainDescriptor<undefined>;
    /**
     *Arithmetic error.
     */
    Arithmetic: PlainDescriptor<undefined>;
    /**
     *Pot's balance is zero.
     */
    MissingPotBalance: PlainDescriptor<undefined>;
    /**
     *Account's position already exists.
     */
    PositionAlreadyExists: PlainDescriptor<undefined>;
    /**
     *Signer is not an owner of the staking position.
     */
    Forbidden: PlainDescriptor<undefined>;
    /**
     *Position contains registered votes.
     */
    ExistingVotes: PlainDescriptor<undefined>;
    /**
     *Position contains processed votes. Removed these votes first before increasing stake or claiming.
     */
    ExistingProcessedVotes: PlainDescriptor<undefined>;
    /**
     *Action cannot be completed because unexpected error has occurred. This should be reported
     *to protocol maintainers.
     */
    InconsistentState: PlainDescriptor<Anonymize<Icojqvn3afk41n>>;
  };
  Stableswap: {
    /**
     *Creating a pool with same assets or less than 2 assets is not allowed.
     */
    IncorrectAssets: PlainDescriptor<undefined>;
    /**
     *Maximum number of assets has been exceeded.
     */
    MaxAssetsExceeded: PlainDescriptor<undefined>;
    /**
     *A pool with given assets does not exist.
     */
    PoolNotFound: PlainDescriptor<undefined>;
    /**
     *A pool with given assets already exists.
     */
    PoolExists: PlainDescriptor<undefined>;
    /**
     *Asset is not in the pool.
     */
    AssetNotInPool: PlainDescriptor<undefined>;
    /**
     *Share asset is not registered in Registry.
     */
    ShareAssetNotRegistered: PlainDescriptor<undefined>;
    /**
     *Share asset is amount assets when creating a pool.
     */
    ShareAssetInPoolAssets: PlainDescriptor<undefined>;
    /**
     *One or more assets are not registered in AssetRegistry
     */
    AssetNotRegistered: PlainDescriptor<undefined>;
    /**
     *Invalid asset amount provided. Amount must be greater than zero.
     */
    InvalidAssetAmount: PlainDescriptor<undefined>;
    /**
     *Balance of an asset is not sufficient to perform a trade.
     */
    InsufficientBalance: PlainDescriptor<undefined>;
    /**
     *Balance of a share asset is not sufficient to withdraw liquidity.
     */
    InsufficientShares: PlainDescriptor<undefined>;
    /**
     *Liquidity has not reached the required minimum.
     */
    InsufficientLiquidity: PlainDescriptor<undefined>;
    /**
     *Insufficient liquidity left in the pool after withdrawal.
     */
    InsufficientLiquidityRemaining: PlainDescriptor<undefined>;
    /**
     *Amount is less than the minimum trading amount configured.
     */
    InsufficientTradingAmount: PlainDescriptor<undefined>;
    /**
     *Minimum limit has not been reached during trade.
     */
    BuyLimitNotReached: PlainDescriptor<undefined>;
    /**
     *Maximum limit has been exceeded during trade.
     */
    SellLimitExceeded: PlainDescriptor<undefined>;
    /**
     *Initial liquidity of asset must be > 0.
     */
    InvalidInitialLiquidity: PlainDescriptor<undefined>;
    /**
     *Amplification is outside configured range.
     */
    InvalidAmplification: PlainDescriptor<undefined>;
    /**
     *Remaining balance of share asset is below asset's existential deposit.
     */
    InsufficientShareBalance: PlainDescriptor<undefined>;
    /**
     *Not allowed to perform an operation on given asset.
     */
    NotAllowed: PlainDescriptor<undefined>;
    /**
     *Future block number is in the past.
     */
    PastBlock: PlainDescriptor<undefined>;
    /**
     *New amplification is equal to the previous value.
     */
    SameAmplification: PlainDescriptor<undefined>;
    /**
     *Slippage protection.
     */
    SlippageLimit: PlainDescriptor<undefined>;
    /**
     *Failed to retrieve asset decimals.
     */
    UnknownDecimals: PlainDescriptor<undefined>;
  };
  Bonds: {
    /**
     *Bond not registered
     */
    NotRegistered: PlainDescriptor<undefined>;
    /**
     *Bond is not mature
     */
    NotMature: PlainDescriptor<undefined>;
    /**
     *Maturity not long enough
     */
    InvalidMaturity: PlainDescriptor<undefined>;
    /**
     *Asset type not allowed for underlying asset
     */
    DisallowedAsset: PlainDescriptor<undefined>;
    /**
     *Asset is not registered in `AssetRegistry`
     */
    AssetNotFound: PlainDescriptor<undefined>;
    /**
     *Generated name is not valid.
     */
    InvalidBondName: PlainDescriptor<undefined>;
    /**
     *Bond's name parsing was now successful
     */
    FailToParseName: PlainDescriptor<undefined>;
  };
  OtcSettlements: {
    /**
     *Otc order not found
     */
    OrderNotFound: PlainDescriptor<undefined>;
    /**
     *OTC order is not partially fillable
     */
    NotPartiallyFillable: PlainDescriptor<undefined>;
    /**
     *Provided route doesn't match the existing route
     */
    InvalidRoute: PlainDescriptor<undefined>;
    /**
     *Initial and final balance are different
     */
    BalanceInconsistency: PlainDescriptor<undefined>;
    /**
     *Trade amount higher than necessary
     */
    TradeAmountTooHigh: PlainDescriptor<undefined>;
    /**
     *Trade amount lower than necessary
     */
    TradeAmountTooLow: PlainDescriptor<undefined>;
    /**
     *Price for a route is not available
     */
    PriceNotAvailable: PlainDescriptor<undefined>;
  };
  LBP: {
    /**
     *Pool assets can not be the same
     */
    CannotCreatePoolWithSameAssets: PlainDescriptor<undefined>;
    /**
     *Account is not a pool owner
     */
    NotOwner: PlainDescriptor<undefined>;
    /**
     *Sale already started
     */
    SaleStarted: PlainDescriptor<undefined>;
    /**
     *Sale is still in progress
     */
    SaleNotEnded: PlainDescriptor<undefined>;
    /**
     *Sale is not running
     */
    SaleIsNotRunning: PlainDescriptor<undefined>;
    /**
     *Sale duration is too long
     */
    MaxSaleDurationExceeded: PlainDescriptor<undefined>;
    /**
     *Liquidity being added should not be zero
     */
    CannotAddZeroLiquidity: PlainDescriptor<undefined>;
    /**
     *Asset balance too low
     */
    InsufficientAssetBalance: PlainDescriptor<undefined>;
    /**
     *Pool does not exist
     */
    PoolNotFound: PlainDescriptor<undefined>;
    /**
     *Pool has been already created
     */
    PoolAlreadyExists: PlainDescriptor<undefined>;
    /**
     *Invalid block range
     */
    InvalidBlockRange: PlainDescriptor<undefined>;
    /**
     *Calculation error
     */
    WeightCalculationError: PlainDescriptor<undefined>;
    /**
     *Weight set is out of range
     */
    InvalidWeight: PlainDescriptor<undefined>;
    /**
     *Can not perform a trade with zero amount
     */
    ZeroAmount: PlainDescriptor<undefined>;
    /**
     *Trade amount is too high
     */
    MaxInRatioExceeded: PlainDescriptor<undefined>;
    /**
     *Trade amount is too high
     */
    MaxOutRatioExceeded: PlainDescriptor<undefined>;
    /**
     *Invalid fee amount
     */
    FeeAmountInvalid: PlainDescriptor<undefined>;
    /**
     *Trading limit reached
     */
    TradingLimitReached: PlainDescriptor<undefined>;
    /**
     *An unexpected integer overflow occurred
     */
    Overflow: PlainDescriptor<undefined>;
    /**
     *Nothing to update
     */
    NothingToUpdate: PlainDescriptor<undefined>;
    /**
     *Liquidity has not reached the required minimum.
     */
    InsufficientLiquidity: PlainDescriptor<undefined>;
    /**
     *Amount is less than minimum trading limit.
     */
    InsufficientTradingAmount: PlainDescriptor<undefined>;
    /**
     *Not more than one fee collector per asset id
     */
    FeeCollectorWithAssetAlreadyUsed: PlainDescriptor<undefined>;
  };
  XYK: {
    /**
     *It is not allowed to create a pool between same assets.
     */
    CannotCreatePoolWithSameAssets: PlainDescriptor<undefined>;
    /**
     *Liquidity has not reached the required minimum.
     */
    InsufficientLiquidity: PlainDescriptor<undefined>;
    /**
     *Amount is less than min trading limit.
     */
    InsufficientTradingAmount: PlainDescriptor<undefined>;
    /**
     *Liquidity is zero.
     */
    ZeroLiquidity: PlainDescriptor<undefined>;
    /**
     *It is not allowed to create a pool with zero initial price.
     *Not used, kept for backward compatibility
     */
    ZeroInitialPrice: PlainDescriptor<undefined>;
    /**
     *Overflow
     *Not used, kept for backward compatibility
     */
    CreatePoolAssetAmountInvalid: PlainDescriptor<undefined>;
    /**
     *Overflow
     */
    InvalidMintedLiquidity: PlainDescriptor<undefined>;
    /**
     *Overflow
     */
    InvalidLiquidityAmount: PlainDescriptor<undefined>;
    /**
     *Asset amount has exceeded given limit.
     */
    AssetAmountExceededLimit: PlainDescriptor<undefined>;
    /**
     *Asset amount has not reached given limit.
     */
    AssetAmountNotReachedLimit: PlainDescriptor<undefined>;
    /**
     *Asset balance is not sufficient.
     */
    InsufficientAssetBalance: PlainDescriptor<undefined>;
    /**
     *Not enough asset liquidity in the pool.
     */
    InsufficientPoolAssetBalance: PlainDescriptor<undefined>;
    /**
     *Not enough core asset liquidity in the pool.
     */
    InsufficientNativeCurrencyBalance: PlainDescriptor<undefined>;
    /**
     *Liquidity pool for given assets does not exist.
     */
    TokenPoolNotFound: PlainDescriptor<undefined>;
    /**
     *Liquidity pool for given assets already exists.
     */
    TokenPoolAlreadyExists: PlainDescriptor<undefined>;
    /**
     *Overflow
     */
    AddAssetAmountInvalid: PlainDescriptor<undefined>;
    /**
     *Overflow
     */
    RemoveAssetAmountInvalid: PlainDescriptor<undefined>;
    /**
     *Overflow
     */
    SellAssetAmountInvalid: PlainDescriptor<undefined>;
    /**
     *Overflow
     */
    BuyAssetAmountInvalid: PlainDescriptor<undefined>;
    /**
     *Overflow
     */
    FeeAmountInvalid: PlainDescriptor<undefined>;
    /**
     *Overflow
     */
    CannotApplyDiscount: PlainDescriptor<undefined>;
    /**
     *Max fraction of pool to buy in single transaction has been exceeded.
     */
    MaxOutRatioExceeded: PlainDescriptor<undefined>;
    /**
     *Max fraction of pool to sell in single transaction has been exceeded.
     */
    MaxInRatioExceeded: PlainDescriptor<undefined>;
    /**
     *Overflow
     */
    Overflow: PlainDescriptor<undefined>;
    /**
     *Pool cannot be created due to outside factors.
     */
    CannotCreatePool: PlainDescriptor<undefined>;
  };
  Referrals: {
    /**
     *Referral code is too long.
     */
    TooLong: PlainDescriptor<undefined>;
    /**
     *Referral code is too short.
     */
    TooShort: PlainDescriptor<undefined>;
    /**
     *Referral code contains invalid character. Only alphanumeric characters are allowed.
     */
    InvalidCharacter: PlainDescriptor<undefined>;
    /**
     *Referral code already exists.
     */
    AlreadyExists: PlainDescriptor<undefined>;
    /**
     *Provided referral code is invalid. Either does not exist or is too long.
     */
    InvalidCode: PlainDescriptor<undefined>;
    /**
     *Account is already linked to another referral account.
     */
    AlreadyLinked: PlainDescriptor<undefined>;
    /**
     *Nothing in the referral pot account for the asset.
     */
    ZeroAmount: PlainDescriptor<undefined>;
    /**
     *Linking an account to the same referral account is not allowed.
     */
    LinkNotAllowed: PlainDescriptor<undefined>;
    /**
     *Calculated rewards are more than the fee amount. This can happen if percentages are incorrectly set.
     */
    IncorrectRewardCalculation: PlainDescriptor<undefined>;
    /**
     *Given referrer and trader percentages exceeds 100% percent.
     */
    IncorrectRewardPercentage: PlainDescriptor<undefined>;
    /**
     *The account has already a code registered.
     */
    AlreadyRegistered: PlainDescriptor<undefined>;
    /**
     *Price for given asset pair not found.
     */
    PriceNotFound: PlainDescriptor<undefined>;
    /**
     *Minimum trading amount for conversion has not been reached.
     */
    ConversionMinTradingAmountNotReached: PlainDescriptor<undefined>;
    /**
     *Zero amount received from conversion.
     */
    ConversionZeroAmountReceived: PlainDescriptor<undefined>;
  };
  Liquidation: {
    /**
     *AssetId to EVM address conversion failed
     */
    AssetConversionFailed: PlainDescriptor<undefined>;
    /**
     *Liquidation call failed
     */
    LiquidationCallFailed: PlainDescriptor<undefined>;
    /**
     *Provided route doesn't match the existing route
     */
    InvalidRoute: PlainDescriptor<undefined>;
    /**
     *Liquidation was not profitable enough to repay flash loan
     */
    NotProfitable: PlainDescriptor<undefined>;
  };
  Tokens: {
    /**
     *The balance is too low
     */
    BalanceTooLow: PlainDescriptor<undefined>;
    /**
     *Cannot convert Amount into Balance type
     */
    AmountIntoBalanceFailed: PlainDescriptor<undefined>;
    /**
     *Failed because liquidity restrictions due to locking
     */
    LiquidityRestrictions: PlainDescriptor<undefined>;
    /**
     *Failed because the maximum locks was exceeded
     */
    MaxLocksExceeded: PlainDescriptor<undefined>;
    /**
     *Transfer/payment would kill account
     */
    KeepAlive: PlainDescriptor<undefined>;
    /**
     *Value too low to create account due to existential deposit
     */
    ExistentialDeposit: PlainDescriptor<undefined>;
    /**
     *Beneficiary account must pre-exist
     */
    DeadAccount: PlainDescriptor<undefined>;
    /**
        
         */
    TooManyReserves: PlainDescriptor<undefined>;
  };
  Currencies: {
    /**
     *Unable to convert the Amount type into Balance.
     */
    AmountIntoBalanceFailed: PlainDescriptor<undefined>;
    /**
     *Balance is too low.
     */
    BalanceTooLow: PlainDescriptor<undefined>;
    /**
     *Deposit result is not expected
     */
    DepositFailed: PlainDescriptor<undefined>;
    /**
     *Operation is not supported for this currency
     */
    NotSupported: PlainDescriptor<undefined>;
  };
  Vesting: {
    /**
     *Vesting period is zero
     */
    ZeroVestingPeriod: PlainDescriptor<undefined>;
    /**
     *Number of vests is zero
     */
    ZeroVestingPeriodCount: PlainDescriptor<undefined>;
    /**
     *Insufficient amount of balance to lock
     */
    InsufficientBalanceToLock: PlainDescriptor<undefined>;
    /**
     *This account have too many vesting schedules
     */
    TooManyVestingSchedules: PlainDescriptor<undefined>;
    /**
     *The vested transfer amount is too low
     */
    AmountLow: PlainDescriptor<undefined>;
    /**
     *Failed because the maximum vesting schedules was exceeded
     */
    MaxVestingSchedulesExceeded: PlainDescriptor<undefined>;
  };
  EVM: {
    /**
     *Not enough balance to perform action
     */
    BalanceLow: PlainDescriptor<undefined>;
    /**
     *Calculating total fee overflowed
     */
    FeeOverflow: PlainDescriptor<undefined>;
    /**
     *Calculating total payment overflowed
     */
    PaymentOverflow: PlainDescriptor<undefined>;
    /**
     *Withdraw fee failed
     */
    WithdrawFailed: PlainDescriptor<undefined>;
    /**
     *Gas price is too low.
     */
    GasPriceTooLow: PlainDescriptor<undefined>;
    /**
     *Nonce is invalid
     */
    InvalidNonce: PlainDescriptor<undefined>;
    /**
     *Gas limit is too low.
     */
    GasLimitTooLow: PlainDescriptor<undefined>;
    /**
     *Gas limit is too high.
     */
    GasLimitTooHigh: PlainDescriptor<undefined>;
    /**
     *The chain id is invalid.
     */
    InvalidChainId: PlainDescriptor<undefined>;
    /**
     *the signature is invalid.
     */
    InvalidSignature: PlainDescriptor<undefined>;
    /**
     *EVM reentrancy
     */
    Reentrancy: PlainDescriptor<undefined>;
    /**
     *EIP-3607,
     */
    TransactionMustComeFromEOA: PlainDescriptor<undefined>;
    /**
     *Undefined error.
     */
    Undefined: PlainDescriptor<undefined>;
  };
  Ethereum: {
    /**
     *Signature is invalid.
     */
    InvalidSignature: PlainDescriptor<undefined>;
    /**
     *Pre-log is present, therefore transact is not allowed.
     */
    PreLogExists: PlainDescriptor<undefined>;
  };
  EVMAccounts: {
    /**
     *Active EVM account cannot be bound
     */
    TruncatedAccountAlreadyUsed: PlainDescriptor<undefined>;
    /**
     *Address is already bound
     */
    AddressAlreadyBound: PlainDescriptor<undefined>;
    /**
     *Bound address cannot be used
     */
    BoundAddressCannotBeUsed: PlainDescriptor<undefined>;
    /**
     *Address not whitelisted
     */
    AddressNotWhitelisted: PlainDescriptor<undefined>;
  };
  XYKLiquidityMining: {
    /**
     *Nft pallet didn't return an owner.
     */
    CantFindDepositOwner: PlainDescriptor<undefined>;
    /**
     *Account balance of XYK pool shares is not sufficient.
     */
    InsufficientXykSharesBalance: PlainDescriptor<undefined>;
    /**
     *XYK pool does not exist
     */
    XykPoolDoesntExist: PlainDescriptor<undefined>;
    /**
     *Account is not deposit owner.
     */
    NotDepositOwner: PlainDescriptor<undefined>;
    /**
     *XYK did not return assets for given pool id
     */
    CantGetXykAssets: PlainDescriptor<undefined>;
    /**
     *Deposit data not found
     */
    DepositDataNotFound: PlainDescriptor<undefined>;
    /**
     *Calculated reward to claim is 0.
     */
    ZeroClaimedRewards: PlainDescriptor<undefined>;
    /**
     *Asset is not in the `AssetPair`.
     */
    AssetNotInAssetPair: PlainDescriptor<undefined>;
    /**
     *Provided `AssetPair` is not used by the deposit.
     */
    InvalidAssetPair: PlainDescriptor<undefined>;
    /**
     *Asset is not registered in asset registry.
     */
    AssetNotRegistered: PlainDescriptor<undefined>;
    /**
     *Failed to calculate `pot`'s account.
     */
    FailToGetPotId: PlainDescriptor<undefined>;
    /**
     *No global farm - yield farm pairs specified to join
     */
    NoFarmsSpecified: PlainDescriptor<undefined>;
  };
  XYKWarehouseLM: {
    /**
     *Global farm does not exist.
     */
    GlobalFarmNotFound: PlainDescriptor<undefined>;
    /**
     *Yield farm does not exist.
     */
    YieldFarmNotFound: PlainDescriptor<undefined>;
    /**
     *Multiple claims in the same period is not allowed.
     */
    DoubleClaimInPeriod: PlainDescriptor<undefined>;
    /**
     *Liquidity mining is canceled.
     */
    LiquidityMiningCanceled: PlainDescriptor<undefined>;
    /**
     *Liquidity mining is not canceled.
     */
    LiquidityMiningIsActive: PlainDescriptor<undefined>;
    /**
     *Liquidity mining is in `active` or `terminated` state and action cannot be completed.
     */
    LiquidityMiningIsNotStopped: PlainDescriptor<undefined>;
    /**
     *LP shares amount is not valid.
     */
    InvalidDepositAmount: PlainDescriptor<undefined>;
    /**
     *Account is not allowed to perform action.
     */
    Forbidden: PlainDescriptor<undefined>;
    /**
     *Yield farm multiplier can't be 0.
     */
    InvalidMultiplier: PlainDescriptor<undefined>;
    /**
     *Yield farm with given `amm_pool_id` already exists in global farm.
     */
    YieldFarmAlreadyExists: PlainDescriptor<undefined>;
    /**
     *Loyalty curve's initial reward percentage is not valid. Valid range is: [0, 1).
     */
    InvalidInitialRewardPercentage: PlainDescriptor<undefined>;
    /**
     *One or more yield farms exist in global farm.
     */
    GlobalFarmIsNotEmpty: PlainDescriptor<undefined>;
    /**
     *Farm's `incentivized_asset` is missing in provided asset pair.
     */
    MissingIncentivizedAsset: PlainDescriptor<undefined>;
    /**
     *Reward currency balance is not sufficient.
     */
    InsufficientRewardCurrencyBalance: PlainDescriptor<undefined>;
    /**
     *Blocks per period can't be 0.
     */
    InvalidBlocksPerPeriod: PlainDescriptor<undefined>;
    /**
     *Yield per period can't be 0.
     */
    InvalidYieldPerPeriod: PlainDescriptor<undefined>;
    /**
     *Total rewards is less than `MinTotalFarmRewards`.
     */
    InvalidTotalRewards: PlainDescriptor<undefined>;
    /**
     *Planned yielding periods is less than `MinPlannedYieldingPeriods`.
     */
    InvalidPlannedYieldingPeriods: PlainDescriptor<undefined>;
    /**
     *Maximum number of locks reached for deposit.
     */
    MaxEntriesPerDeposit: PlainDescriptor<undefined>;
    /**
     *Trying to lock LP shares into already locked yield farm.
     */
    DoubleLock: PlainDescriptor<undefined>;
    /**
     *Yield farm entry doesn't exist for given deposit.
     */
    YieldFarmEntryNotFound: PlainDescriptor<undefined>;
    /**
     *Max number of yield farms in global farm was reached. Global farm can't accept new
     *yield farms until some yield farm is not removed from storage.
     */
    GlobalFarmIsFull: PlainDescriptor<undefined>;
    /**
     *Invalid min. deposit was set for global farm.
     */
    InvalidMinDeposit: PlainDescriptor<undefined>;
    /**
     *Price adjustment multiplier can't be 0.
     */
    InvalidPriceAdjustment: PlainDescriptor<undefined>;
    /**
     *Account creation from id failed.
     */
    ErrorGetAccountId: PlainDescriptor<undefined>;
    /**
     *Value of deposited shares amount in reward currency is bellow min. limit.
     */
    IncorrectValuedShares: PlainDescriptor<undefined>;
    /**
     *`reward_currency` is not registered in asset registry.
     */
    RewardCurrencyNotRegistered: PlainDescriptor<undefined>;
    /**
     *`incentivized_asset` is not registered in asset registry.
     */
    IncentivizedAssetNotRegistered: PlainDescriptor<undefined>;
    /**
     *Action cannot be completed because unexpected error has occurred. This should be reported
     *to protocol maintainers.
     */
    InconsistentState: PlainDescriptor<Anonymize<Ibplkiqg5rvr3e>>;
  };
  DCA: {
    /**
     *Schedule not exist
     */
    ScheduleNotFound: PlainDescriptor<undefined>;
    /**
     *The min trade amount is not reached
     */
    MinTradeAmountNotReached: PlainDescriptor<undefined>;
    /**
     *Forbidden as the user is not the owner of the schedule
     */
    Forbidden: PlainDescriptor<undefined>;
    /**
     *The next execution block number is not in the future
     */
    BlockNumberIsNotInFuture: PlainDescriptor<undefined>;
    /**
     *Price is unstable as price change from oracle data is bigger than max allowed
     */
    PriceUnstable: PlainDescriptor<undefined>;
    /**
     *Order was randomly rescheduled to next block
     */
    Bumped: PlainDescriptor<undefined>;
    /**
     *Error occurred when calculating price
     */
    CalculatingPriceError: PlainDescriptor<undefined>;
    /**
     *The total amount to be reserved is smaller than min budget
     */
    TotalAmountIsSmallerThanMinBudget: PlainDescriptor<undefined>;
    /**
     *The budget is too low for executing at least two orders
     */
    BudgetTooLow: PlainDescriptor<undefined>;
    /**
     *There is no free block found to plan DCA execution
     */
    NoFreeBlockFound: PlainDescriptor<undefined>;
    /**
     *The DCA schedule has been manually terminated
     */
    ManuallyTerminated: PlainDescriptor<undefined>;
    /**
     *Max number of retries reached for schedule
     */
    MaxRetryReached: PlainDescriptor<undefined>;
    /**
     *Absolutely trade limit reached, leading to retry
     */
    TradeLimitReached: PlainDescriptor<undefined>;
    /**
     *Slippage limit calculated from oracle is reached, leading to retry
     */
    SlippageLimitReached: PlainDescriptor<undefined>;
    /**
     *No parent hash has been found from relay chain
     */
    NoParentHashFound: PlainDescriptor<undefined>;
    /**
     *Error that should not really happen only in case of invalid state of the schedule storage entries
     */
    InvalidState: PlainDescriptor<undefined>;
    /**
     *Period should be longer than 5 blocks
     */
    PeriodTooShort: PlainDescriptor<undefined>;
    /**
     *Stability threshold cannot be higher than `MaxConfigurablePriceDifferenceBetweenBlock`
     */
    StabilityThresholdTooHigh: PlainDescriptor<undefined>;
  };
  Scheduler: {
    /**
     *Failed to schedule a call
     */
    FailedToSchedule: PlainDescriptor<undefined>;
    /**
     *Cannot find the scheduled call.
     */
    NotFound: PlainDescriptor<undefined>;
    /**
     *Given target block number is in the past.
     */
    TargetBlockNumberInPast: PlainDescriptor<undefined>;
    /**
     *Reschedule failed because it does not change scheduled time.
     */
    RescheduleNoChange: PlainDescriptor<undefined>;
    /**
     *Attempt to use a non-named function on a named task.
     */
    Named: PlainDescriptor<undefined>;
  };
  ParachainSystem: {
    /**
     *Attempt to upgrade validation function while existing upgrade pending.
     */
    OverlappingUpgrades: PlainDescriptor<undefined>;
    /**
     *Polkadot currently prohibits this parachain from upgrading its validation function.
     */
    ProhibitedByPolkadot: PlainDescriptor<undefined>;
    /**
     *The supplied validation function has compiled into a blob larger than Polkadot is
     *willing to run.
     */
    TooBig: PlainDescriptor<undefined>;
    /**
     *The inherent which supplies the validation data did not run this block.
     */
    ValidationDataNotAvailable: PlainDescriptor<undefined>;
    /**
     *The inherent which supplies the host configuration did not run this block.
     */
    HostConfigurationNotAvailable: PlainDescriptor<undefined>;
    /**
     *No validation function upgrade is currently scheduled.
     */
    NotScheduled: PlainDescriptor<undefined>;
    /**
     *No code upgrade has been authorized.
     */
    NothingAuthorized: PlainDescriptor<undefined>;
    /**
     *The given code upgrade has not been authorized.
     */
    Unauthorized: PlainDescriptor<undefined>;
  };
  PolkadotXcm: {
    /**
     *The desired destination was unreachable, generally because there is a no way of routing
     *to it.
     */
    Unreachable: PlainDescriptor<undefined>;
    /**
     *There was some other issue (i.e. not to do with routing) in sending the message.
     *Perhaps a lack of space for buffering the message.
     */
    SendFailure: PlainDescriptor<undefined>;
    /**
     *The message execution fails the filter.
     */
    Filtered: PlainDescriptor<undefined>;
    /**
     *The message's weight could not be determined.
     */
    UnweighableMessage: PlainDescriptor<undefined>;
    /**
     *The destination `Location` provided cannot be inverted.
     */
    DestinationNotInvertible: PlainDescriptor<undefined>;
    /**
     *The assets to be sent are empty.
     */
    Empty: PlainDescriptor<undefined>;
    /**
     *Could not re-anchor the assets to declare the fees for the destination chain.
     */
    CannotReanchor: PlainDescriptor<undefined>;
    /**
     *Too many assets have been attempted for transfer.
     */
    TooManyAssets: PlainDescriptor<undefined>;
    /**
     *Origin is invalid for sending.
     */
    InvalidOrigin: PlainDescriptor<undefined>;
    /**
     *The version of the `Versioned` value used is not able to be interpreted.
     */
    BadVersion: PlainDescriptor<undefined>;
    /**
     *The given location could not be used (e.g. because it cannot be expressed in the
     *desired version of XCM).
     */
    BadLocation: PlainDescriptor<undefined>;
    /**
     *The referenced subscription could not be found.
     */
    NoSubscription: PlainDescriptor<undefined>;
    /**
     *The location is invalid since it already has a subscription from us.
     */
    AlreadySubscribed: PlainDescriptor<undefined>;
    /**
     *Could not check-out the assets for teleportation to the destination chain.
     */
    CannotCheckOutTeleport: PlainDescriptor<undefined>;
    /**
     *The owner does not own (all) of the asset that they wish to do the operation on.
     */
    LowBalance: PlainDescriptor<undefined>;
    /**
     *The asset owner has too many locks on the asset.
     */
    TooManyLocks: PlainDescriptor<undefined>;
    /**
     *The given account is not an identifiable sovereign account for any location.
     */
    AccountNotSovereign: PlainDescriptor<undefined>;
    /**
     *The operation required fees to be paid which the initiator could not meet.
     */
    FeesNotMet: PlainDescriptor<undefined>;
    /**
     *A remote lock with the corresponding data could not be found.
     */
    LockNotFound: PlainDescriptor<undefined>;
    /**
     *The unlock operation cannot succeed because there are still consumers of the lock.
     */
    InUse: PlainDescriptor<undefined>;
    /**
     *Invalid asset, reserve chain could not be determined for it.
     */
    InvalidAssetUnknownReserve: PlainDescriptor<undefined>;
    /**
     *Invalid asset, do not support remote asset reserves with different fees reserves.
     */
    InvalidAssetUnsupportedReserve: PlainDescriptor<undefined>;
    /**
     *Too many assets with different reserve locations have been attempted for transfer.
     */
    TooManyReserves: PlainDescriptor<undefined>;
    /**
     *Local XCM execution incomplete.
     */
    LocalExecutionIncomplete: PlainDescriptor<undefined>;
  };
  XcmpQueue: {
    /**
     *Setting the queue config failed since one of its values was invalid.
     */
    BadQueueConfig: PlainDescriptor<undefined>;
    /**
     *The execution is already suspended.
     */
    AlreadySuspended: PlainDescriptor<undefined>;
    /**
     *The execution is already resumed.
     */
    AlreadyResumed: PlainDescriptor<undefined>;
  };
  MessageQueue: {
    /**
     *Page is not reapable because it has items remaining to be processed and is not old
     *enough.
     */
    NotReapable: PlainDescriptor<undefined>;
    /**
     *Page to be reaped does not exist.
     */
    NoPage: PlainDescriptor<undefined>;
    /**
     *The referenced message could not be found.
     */
    NoMessage: PlainDescriptor<undefined>;
    /**
     *The message was already processed and cannot be processed again.
     */
    AlreadyProcessed: PlainDescriptor<undefined>;
    /**
     *The message is queued for future execution.
     */
    Queued: PlainDescriptor<undefined>;
    /**
     *There is temporarily not enough weight to continue servicing messages.
     */
    InsufficientWeight: PlainDescriptor<undefined>;
    /**
     *This message is temporarily unprocessable.
     *
     *Such errors are expected, but not guaranteed, to resolve themselves eventually through
     *retrying.
     */
    TemporarilyUnprocessable: PlainDescriptor<undefined>;
    /**
     *The queue is paused and no message can be executed from it.
     *
     *This can change at any time and may resolve in the future by re-trying.
     */
    QueuePaused: PlainDescriptor<undefined>;
    /**
     *Another call is in progress and needs to finish before this call can happen.
     */
    RecursiveDisallowed: PlainDescriptor<undefined>;
  };
  OrmlXcm: {
    /**
     *The message and destination combination was not recognized as being
     *reachable.
     */
    Unreachable: PlainDescriptor<undefined>;
    /**
     *The message and destination was recognized as being reachable but
     *the operation could not be completed.
     */
    SendFailure: PlainDescriptor<undefined>;
    /**
     *The version of the `Versioned` value used is not able to be
     *interpreted.
     */
    BadVersion: PlainDescriptor<undefined>;
  };
  XTokens: {
    /**
     *Asset has no reserve location.
     */
    AssetHasNoReserve: PlainDescriptor<undefined>;
    /**
     *Not cross-chain transfer.
     */
    NotCrossChainTransfer: PlainDescriptor<undefined>;
    /**
     *Invalid transfer destination.
     */
    InvalidDest: PlainDescriptor<undefined>;
    /**
     *Currency is not cross-chain transferable.
     */
    NotCrossChainTransferableCurrency: PlainDescriptor<undefined>;
    /**
     *The message's weight could not be determined.
     */
    UnweighableMessage: PlainDescriptor<undefined>;
    /**
     *XCM execution failed.
     */
    XcmExecutionFailed: PlainDescriptor<undefined>;
    /**
     *Could not re-anchor the assets to declare the fees for the
     *destination chain.
     */
    CannotReanchor: PlainDescriptor<undefined>;
    /**
     *Could not get ancestry of asset reserve location.
     */
    InvalidAncestry: PlainDescriptor<undefined>;
    /**
     *The Asset is invalid.
     */
    InvalidAsset: PlainDescriptor<undefined>;
    /**
     *The destination `Location` provided cannot be inverted.
     */
    DestinationNotInvertible: PlainDescriptor<undefined>;
    /**
     *The version of the `Versioned` value used is not able to be
     *interpreted.
     */
    BadVersion: PlainDescriptor<undefined>;
    /**
     *We tried sending distinct asset and fee but they have different
     *reserve chains.
     */
    DistinctReserveForAssetAndFee: PlainDescriptor<undefined>;
    /**
     *The fee is zero.
     */
    ZeroFee: PlainDescriptor<undefined>;
    /**
     *The transfering asset amount is zero.
     */
    ZeroAmount: PlainDescriptor<undefined>;
    /**
     *The number of assets to be sent is over the maximum.
     */
    TooManyAssetsBeingSent: PlainDescriptor<undefined>;
    /**
     *The specified index does not exist in a Assets struct.
     */
    AssetIndexNonExistent: PlainDescriptor<undefined>;
    /**
     *Fee is not enough.
     */
    FeeNotEnough: PlainDescriptor<undefined>;
    /**
     *Not supported Location
     */
    NotSupportedLocation: PlainDescriptor<undefined>;
    /**
     *MinXcmFee not registered for certain reserve location
     */
    MinXcmFeeNotDefined: PlainDescriptor<undefined>;
    /**
     *Asset transfer is limited by RateLimiter.
     */
    RateLimited: PlainDescriptor<undefined>;
  };
  UnknownTokens: {
    /**
     *The balance is too low.
     */
    BalanceTooLow: PlainDescriptor<undefined>;
    /**
     *The operation will cause balance to overflow.
     */
    BalanceOverflow: PlainDescriptor<undefined>;
    /**
     *Unhandled asset.
     */
    UnhandledAsset: PlainDescriptor<undefined>;
  };
  CollatorSelection: {
    /**
     *The pallet has too many candidates.
     */
    TooManyCandidates: PlainDescriptor<undefined>;
    /**
     *Leaving would result in too few candidates.
     */
    TooFewEligibleCollators: PlainDescriptor<undefined>;
    /**
     *Account is already a candidate.
     */
    AlreadyCandidate: PlainDescriptor<undefined>;
    /**
     *Account is not a candidate.
     */
    NotCandidate: PlainDescriptor<undefined>;
    /**
     *There are too many Invulnerables.
     */
    TooManyInvulnerables: PlainDescriptor<undefined>;
    /**
     *Account is already an Invulnerable.
     */
    AlreadyInvulnerable: PlainDescriptor<undefined>;
    /**
     *Account is not an Invulnerable.
     */
    NotInvulnerable: PlainDescriptor<undefined>;
    /**
     *Account has no associated validator ID.
     */
    NoAssociatedValidatorId: PlainDescriptor<undefined>;
    /**
     *Validator ID is not yet registered.
     */
    ValidatorNotRegistered: PlainDescriptor<undefined>;
    /**
     *Could not insert in the candidate list.
     */
    InsertToCandidateListFailed: PlainDescriptor<undefined>;
    /**
     *Could not remove from the candidate list.
     */
    RemoveFromCandidateListFailed: PlainDescriptor<undefined>;
    /**
     *New deposit amount would be below the minimum candidacy bond.
     */
    DepositTooLow: PlainDescriptor<undefined>;
    /**
     *Could not update the candidate list.
     */
    UpdateCandidateListFailed: PlainDescriptor<undefined>;
    /**
     *Deposit amount is too low to take the target's slot in the candidate list.
     */
    InsufficientBond: PlainDescriptor<undefined>;
    /**
     *The target account to be replaced in the candidate list is not a candidate.
     */
    TargetIsNotCandidate: PlainDescriptor<undefined>;
    /**
     *The updated deposit amount is equal to the amount already reserved.
     */
    IdenticalDeposit: PlainDescriptor<undefined>;
    /**
     *Cannot lower candidacy bond while occupying a future collator slot in the list.
     */
    InvalidUnreserve: PlainDescriptor<undefined>;
  };
  Session: {
    /**
     *Invalid ownership proof.
     */
    InvalidProof: PlainDescriptor<undefined>;
    /**
     *No associated validator ID for account.
     */
    NoAssociatedValidatorId: PlainDescriptor<undefined>;
    /**
     *Registered duplicate key.
     */
    DuplicatedKey: PlainDescriptor<undefined>;
    /**
     *No keys are associated with this account.
     */
    NoKeys: PlainDescriptor<undefined>;
    /**
     *Key setting account is not live, so it's impossible to associate keys.
     */
    NoAccount: PlainDescriptor<undefined>;
  };
  EmaOracle: {
    /**
        
         */
    TooManyUniqueEntries: PlainDescriptor<undefined>;
    /**
        
         */
    OnTradeValueZero: PlainDescriptor<undefined>;
    /**
        
         */
    OracleNotFound: PlainDescriptor<undefined>;
  };
};
type IConstants = {
  System: {
    /**
     * Block & extrinsics weights: base values and limits.
     */
    BlockWeights: PlainDescriptor<Anonymize<In7a38730s6qs>>;
    /**
     * The maximum length of a block (in bytes).
     */
    BlockLength: PlainDescriptor<Anonymize<If15el53dd76v9>>;
    /**
     * Maximum number of block number to block hash mappings to keep (oldest pruned first).
     */
    BlockHashCount: PlainDescriptor<number>;
    /**
     * The weight of runtime database operations the runtime can invoke.
     */
    DbWeight: PlainDescriptor<Anonymize<I9s0ave7t0vnrk>>;
    /**
     * Get the chain's in-code version.
     */
    Version: PlainDescriptor<Anonymize<Ic6nglu2db2c36>>;
    /**
     * The designated SS58 prefix of this chain.
     *
     * This replaces the "ss58Format" property declared in the chain spec. Reason is
     * that the runtime should know about the prefix in order to make use of it as
     * an identifier of the chain.
     */
    SS58Prefix: PlainDescriptor<number>;
  };
  Timestamp: {
    /**
     * The minimum period between blocks.
     *
     * Be aware that this is different to the *expected* period that the block production
     * apparatus provides. Your chosen consensus system will generally work with this to
     * determine a sensible block time. For example, in the Aura pallet it will be double this
     * period on default settings.
     */
    MinimumPeriod: PlainDescriptor<bigint>;
  };
  Balances: {
    /**
     * The minimum amount required to keep an account open. MUST BE GREATER THAN ZERO!
     *
     * If you *really* need it to be zero, you can enable the feature `insecure_zero_ed` for
     * this pallet. However, you do so at your own risk: this will open up a major DoS vector.
     * In case you have multiple sources of provider references, you may also get unexpected
     * behaviour if you set this to zero.
     *
     * Bottom line: Do yourself a favour and make it at least one!
     */
    ExistentialDeposit: PlainDescriptor<bigint>;
    /**
     * The maximum number of locks that should exist on an account.
     * Not strictly enforced, but used for weight estimation.
     *
     * Use of locks is deprecated in favour of freezes. See `https://github.com/paritytech/substrate/pull/12951/`
     */
    MaxLocks: PlainDescriptor<number>;
    /**
     * The maximum number of named reserves that can exist on an account.
     *
     * Use of reserves is deprecated in favour of holds. See `https://github.com/paritytech/substrate/pull/12951/`
     */
    MaxReserves: PlainDescriptor<number>;
    /**
     * The maximum number of individual freeze locks that can exist on an account at any time.
     */
    MaxFreezes: PlainDescriptor<number>;
  };
  TransactionPayment: {
    /**
     * A fee multiplier for `Operational` extrinsics to compute "virtual tip" to boost their
     * `priority`
     *
     * This value is multiplied by the `final_fee` to obtain a "virtual tip" that is later
     * added to a tip component in regular `priority` calculations.
     * It means that a `Normal` transaction can front-run a similarly-sized `Operational`
     * extrinsic (with no tip), by including a tip value greater than the virtual tip.
     *
     * ```rust,ignore
     * // For `Normal`
     * let priority = priority_calc(tip);
     *
     * // For `Operational`
     * let virtual_tip = (inclusion_fee + tip) * OperationalFeeMultiplier;
     * let priority = priority_calc(tip + virtual_tip);
     * ```
     *
     * Note that since we use `final_fee` the multiplier applies also to the regular `tip`
     * sent with the transaction. So, not only does the transaction get a priority bump based
     * on the `inclusion_fee`, but we also amplify the impact of tips applied to `Operational`
     * transactions.
     */
    OperationalFeeMultiplier: PlainDescriptor<number>;
  };
  MultiTransactionPayment: {
    /**
     * Native Asset
     */
    NativeAssetId: PlainDescriptor<number>;
    /**
     * Polkadot Native Asset (DOT)
     */
    PolkadotNativeAssetId: PlainDescriptor<number>;
    /**
     * EVM Asset
     */
    EvmAssetId: PlainDescriptor<number>;
  };
  Treasury: {
    /**
     * Fraction of a proposal's value that should be bonded in order to place the proposal.
     * An accepted proposal gets these back. A rejected proposal does not.
     */
    ProposalBond: PlainDescriptor<number>;
    /**
     * Minimum amount of funds that should be placed in a deposit for making a proposal.
     */
    ProposalBondMinimum: PlainDescriptor<bigint>;
    /**
     * Maximum amount of funds that should be placed in a deposit for making a proposal.
     */
    ProposalBondMaximum: PlainDescriptor<Anonymize<I35p85j063s0il>>;
    /**
     * Period between successive spends.
     */
    SpendPeriod: PlainDescriptor<number>;
    /**
     * Percentage of spare funds (if any) that are burnt per spend period.
     */
    Burn: PlainDescriptor<number>;
    /**
     * The treasury's pallet id, used for deriving its sovereign account ID.
     */
    PalletId: PlainDescriptor<FixedSizeBinary<8>>;
    /**
     * The maximum number of approvals that can wait in the spending queue.
     *
     * NOTE: This parameter is also used within the Bounties Pallet extension if enabled.
     */
    MaxApprovals: PlainDescriptor<number>;
    /**
     * The period during which an approved treasury spend has to be claimed.
     */
    PayoutPeriod: PlainDescriptor<number>;
  };
  Utility: {
    /**
     * The limit on the number of batched calls.
     */
    batched_calls_limit: PlainDescriptor<number>;
  };
  Identity: {
    /**
     * The amount held on deposit for a registered identity.
     */
    BasicDeposit: PlainDescriptor<bigint>;
    /**
     * The amount held on deposit per encoded byte for a registered identity.
     */
    ByteDeposit: PlainDescriptor<bigint>;
    /**
     * The amount held on deposit for a registered subaccount. This should account for the fact
     * that one storage item's value will increase by the size of an account ID, and there will
     * be another trie item whose value is the size of an account ID plus 32 bytes.
     */
    SubAccountDeposit: PlainDescriptor<bigint>;
    /**
     * The maximum number of sub-accounts allowed per identified account.
     */
    MaxSubAccounts: PlainDescriptor<number>;
    /**
     * Maximum number of registrars allowed in the system. Needed to bound the complexity
     * of, e.g., updating judgements.
     */
    MaxRegistrars: PlainDescriptor<number>;
    /**
     * The number of blocks within which a username grant must be accepted.
     */
    PendingUsernameExpiration: PlainDescriptor<number>;
    /**
     * The maximum length of a suffix.
     */
    MaxSuffixLength: PlainDescriptor<number>;
    /**
     * The maximum length of a username, including its suffix and any system-added delimiters.
     */
    MaxUsernameLength: PlainDescriptor<number>;
  };
  Democracy: {
    /**
     * The period between a proposal being approved and enacted.
     *
     * It should generally be a little more than the unstake period to ensure that
     * voting stakers have an opportunity to remove themselves from the system in the case
     * where they are on the losing side of a vote.
     */
    EnactmentPeriod: PlainDescriptor<number>;
    /**
     * How often (in blocks) new public referenda are launched.
     */
    LaunchPeriod: PlainDescriptor<number>;
    /**
     * How often (in blocks) to check for new votes.
     */
    VotingPeriod: PlainDescriptor<number>;
    /**
     * The minimum period of vote locking.
     *
     * It should be no shorter than enactment period to ensure that in the case of an approval,
     * those successful voters are locked into the consequences that their votes entail.
     */
    VoteLockingPeriod: PlainDescriptor<number>;
    /**
     * The minimum amount to be used as a deposit for a public referendum proposal.
     */
    MinimumDeposit: PlainDescriptor<bigint>;
    /**
     * Indicator for whether an emergency origin is even allowed to happen. Some chains may
     * want to set this permanently to `false`, others may want to condition it on things such
     * as an upgrade having happened recently.
     */
    InstantAllowed: PlainDescriptor<boolean>;
    /**
     * Minimum voting period allowed for a fast-track referendum.
     */
    FastTrackVotingPeriod: PlainDescriptor<number>;
    /**
     * Period in blocks where an external proposal may not be re-submitted after being vetoed.
     */
    CooloffPeriod: PlainDescriptor<number>;
    /**
     * The maximum number of votes for an account.
     *
     * Also used to compute weight, an overly big value can
     * lead to extrinsic with very big weight: see `delegate` for instance.
     */
    MaxVotes: PlainDescriptor<number>;
    /**
     * The maximum number of public proposals that can exist at any time.
     */
    MaxProposals: PlainDescriptor<number>;
    /**
     * The maximum number of deposits a public proposal may have at any time.
     */
    MaxDeposits: PlainDescriptor<number>;
    /**
     * The maximum number of items which can be blacklisted.
     */
    MaxBlacklisted: PlainDescriptor<number>;
  };
  Elections: {
    /**
     * Identifier for the elections-phragmen pallet's lock
     */
    PalletId: PlainDescriptor<FixedSizeBinary<8>>;
    /**
     * How much should be locked up in order to submit one's candidacy.
     */
    CandidacyBond: PlainDescriptor<bigint>;
    /**
     * Base deposit associated with voting.
     *
     * This should be sensibly high to economically ensure the pallet cannot be attacked by
     * creating a gigantic number of votes.
     */
    VotingBondBase: PlainDescriptor<bigint>;
    /**
     * The amount of bond that need to be locked for each vote (32 bytes).
     */
    VotingBondFactor: PlainDescriptor<bigint>;
    /**
     * Number of members to elect.
     */
    DesiredMembers: PlainDescriptor<number>;
    /**
     * Number of runners_up to keep.
     */
    DesiredRunnersUp: PlainDescriptor<number>;
    /**
     * How long each seat is kept. This defines the next block number at which an election
     * round will happen. If set to zero, no elections are ever triggered and the module will
     * be in passive mode.
     */
    TermDuration: PlainDescriptor<number>;
    /**
     * The maximum number of candidates in a phragmen election.
     *
     * Warning: This impacts the size of the election which is run onchain. Chose wisely, and
     * consider how it will impact `T::WeightInfo::election_phragmen`.
     *
     * When this limit is reached no more candidates are accepted in the election.
     */
    MaxCandidates: PlainDescriptor<number>;
    /**
     * The maximum number of voters to allow in a phragmen election.
     *
     * Warning: This impacts the size of the election which is run onchain. Chose wisely, and
     * consider how it will impact `T::WeightInfo::election_phragmen`.
     *
     * When the limit is reached the new voters are ignored.
     */
    MaxVoters: PlainDescriptor<number>;
    /**
     * Maximum numbers of votes per voter.
     *
     * Warning: This impacts the size of the election which is run onchain. Chose wisely, and
     * consider how it will impact `T::WeightInfo::election_phragmen`.
     */
    MaxVotesPerVoter: PlainDescriptor<number>;
  };
  Council: {
    /**
     * The maximum weight of a dispatch call that can be proposed and executed.
     */
    MaxProposalWeight: PlainDescriptor<Anonymize<I4q39t5hn830vp>>;
  };
  TechnicalCommittee: {
    /**
     * The maximum weight of a dispatch call that can be proposed and executed.
     */
    MaxProposalWeight: PlainDescriptor<Anonymize<I4q39t5hn830vp>>;
  };
  Tips: {
    /**
     * Maximum acceptable reason length.
     *
     * Benchmarks depend on this value, be sure to update weights file when changing this value
     */
    MaximumReasonLength: PlainDescriptor<number>;
    /**
     * The amount held on deposit per byte within the tip report reason or bounty description.
     */
    DataDepositPerByte: PlainDescriptor<bigint>;
    /**
     * The period for which a tip remains open after is has achieved threshold tippers.
     */
    TipCountdown: PlainDescriptor<number>;
    /**
     * The percent of the final tip which goes to the original reporter of the tip.
     */
    TipFindersFee: PlainDescriptor<number>;
    /**
     * The non-zero amount held on deposit for placing a tip report.
     */
    TipReportDepositBase: PlainDescriptor<bigint>;
    /**
     * The maximum amount for a single tip.
     */
    MaxTipAmount: PlainDescriptor<bigint>;
  };
  Proxy: {
    /**
     * The base amount of currency needed to reserve for creating a proxy.
     *
     * This is held for an additional storage item whose value size is
     * `sizeof(Balance)` bytes and whose key size is `sizeof(AccountId)` bytes.
     */
    ProxyDepositBase: PlainDescriptor<bigint>;
    /**
     * The amount of currency needed per proxy added.
     *
     * This is held for adding 32 bytes plus an instance of `ProxyType` more into a
     * pre-existing storage value. Thus, when configuring `ProxyDepositFactor` one should take
     * into account `32 + proxy_type.encode().len()` bytes of data.
     */
    ProxyDepositFactor: PlainDescriptor<bigint>;
    /**
     * The maximum amount of proxies allowed for a single account.
     */
    MaxProxies: PlainDescriptor<number>;
    /**
     * The maximum amount of time-delayed announcements that are allowed to be pending.
     */
    MaxPending: PlainDescriptor<number>;
    /**
     * The base amount of currency needed to reserve for creating an announcement.
     *
     * This is held when a new storage item holding a `Balance` is created (typically 16
     * bytes).
     */
    AnnouncementDepositBase: PlainDescriptor<bigint>;
    /**
     * The amount of currency needed per announcement made.
     *
     * This is held for adding an `AccountId`, `Hash` and `BlockNumber` (typically 68 bytes)
     * into a pre-existing storage value.
     */
    AnnouncementDepositFactor: PlainDescriptor<bigint>;
  };
  Multisig: {
    /**
     * The base amount of currency needed to reserve for creating a multisig execution or to
     * store a dispatch call for later.
     *
     * This is held for an additional storage item whose value size is
     * `4 + sizeof((BlockNumber, Balance, AccountId))` bytes and whose key size is
     * `32 + sizeof(AccountId)` bytes.
     */
    DepositBase: PlainDescriptor<bigint>;
    /**
     * The amount of currency needed per unit threshold when creating a multisig execution.
     *
     * This is held for adding 32 bytes more into a pre-existing storage value.
     */
    DepositFactor: PlainDescriptor<bigint>;
    /**
     * The maximum amount of signatories allowed in the multisig.
     */
    MaxSignatories: PlainDescriptor<number>;
  };
  Uniques: {
    /**
     * The basic amount of funds that must be reserved for collection.
     */
    CollectionDeposit: PlainDescriptor<bigint>;
    /**
     * The basic amount of funds that must be reserved for an item.
     */
    ItemDeposit: PlainDescriptor<bigint>;
    /**
     * The basic amount of funds that must be reserved when adding metadata to your item.
     */
    MetadataDepositBase: PlainDescriptor<bigint>;
    /**
     * The basic amount of funds that must be reserved when adding an attribute to an item.
     */
    AttributeDepositBase: PlainDescriptor<bigint>;
    /**
     * The additional funds that must be reserved for the number of bytes store in metadata,
     * either "normal" metadata or attribute metadata.
     */
    DepositPerByte: PlainDescriptor<bigint>;
    /**
     * The maximum length of data stored on-chain.
     */
    StringLimit: PlainDescriptor<number>;
    /**
     * The maximum length of an attribute key.
     */
    KeyLimit: PlainDescriptor<number>;
    /**
     * The maximum length of an attribute value.
     */
    ValueLimit: PlainDescriptor<number>;
  };
  StateTrieMigration: {
    /**
     * Maximal number of bytes that a key can have.
     *
     * FRAME itself does not limit the key length.
     * The concrete value must therefore depend on your storage usage.
     * A [`frame_support::storage::StorageNMap`] for example can have an arbitrary number of
     * keys which are then hashed and concatenated, resulting in arbitrarily long keys.
     *
     * Use the *state migration RPC* to retrieve the length of the longest key in your
     * storage: <https://github.com/paritytech/substrate/issues/11642>
     *
     * The migration will halt with a `Halted` event if this value is too small.
     * Since there is no real penalty from over-estimating, it is advised to use a large
     * value. The default is 512 byte.
     *
     * Some key lengths for reference:
     * - [`frame_support::storage::StorageValue`]: 32 byte
     * - [`frame_support::storage::StorageMap`]: 64 byte
     * - [`frame_support::storage::StorageDoubleMap`]: 96 byte
     *
     * For more info see
     * <https://www.shawntabrizi.com/blog/substrate/querying-substrate-storage-via-rpc/>
     */
    MaxKeyLen: PlainDescriptor<number>;
  };
  ConvictionVoting: {
    /**
     * The maximum number of concurrent votes an account may have.
     *
     * Also used to compute weight, an overly large value can lead to extrinsics with large
     * weight estimation: see `delegate` for instance.
     */
    MaxVotes: PlainDescriptor<number>;
    /**
     * The minimum period of vote locking.
     *
     * It should be no shorter than enactment period to ensure that in the case of an approval,
     * those successful voters are locked into the consequences that their votes entail.
     */
    VoteLockingPeriod: PlainDescriptor<number>;
  };
  Referenda: {
    /**
     * The minimum amount to be used as a deposit for a public referendum proposal.
     */
    SubmissionDeposit: PlainDescriptor<bigint>;
    /**
     * Maximum size of the referendum queue for a single track.
     */
    MaxQueued: PlainDescriptor<number>;
    /**
     * The number of blocks after submission that a referendum must begin being decided by.
     * Once this passes, then anyone may cancel the referendum.
     */
    UndecidingTimeout: PlainDescriptor<number>;
    /**
     * Quantization level for the referendum wakeup scheduler. A higher number will result in
     * fewer storage reads/writes needed for smaller voters, but also result in delays to the
     * automatic referendum status changes. Explicit servicing instructions are unaffected.
     */
    AlarmInterval: PlainDescriptor<number>;
    /**
     * Information concerning the different referendum tracks.
     */
    Tracks: PlainDescriptor<Anonymize<Ibafpkl9hhno69>>;
  };
  AssetRegistry: {
    /**
        
         */
    SequentialIdStartAt: PlainDescriptor<number>;
    /**
     * The maximum length of a name or symbol stored on-chain.
     */
    StringLimit: PlainDescriptor<number>;
    /**
     * The min length of a name or symbol stored on-chain.
     */
    MinStringLimit: PlainDescriptor<number>;
    /**
     * Weight multiplier for `register_external` extrinsic
     */
    RegExternalWeightMultiplier: PlainDescriptor<bigint>;
  };
  CollatorRewards: {
    /**
     * Reward amount per one collator.
     */
    RewardPerCollator: PlainDescriptor<bigint>;
    /**
     * Reward Asset Id
     */
    RewardCurrencyId: PlainDescriptor<number>;
  };
  Omnipool: {
    /**
     * Native Asset ID
     */
    HdxAssetId: PlainDescriptor<number>;
    /**
     * Hub Asset ID
     */
    HubAssetId: PlainDescriptor<number>;
    /**
     * Minimum withdrawal fee
     */
    MinWithdrawalFee: PlainDescriptor<number>;
    /**
     * Minimum trading limit
     */
    MinimumTradingLimit: PlainDescriptor<bigint>;
    /**
     * Minimum pool liquidity which can be added
     */
    MinimumPoolLiquidity: PlainDescriptor<bigint>;
    /**
     * Max fraction of asset reserve to sell in single transaction
     */
    MaxInRatio: PlainDescriptor<bigint>;
    /**
     * Max fraction of asset reserve to buy in single transaction
     */
    MaxOutRatio: PlainDescriptor<bigint>;
    /**
     * Non fungible class id
     */
    NFTCollectionId: PlainDescriptor<bigint>;
  };
  Duster: {
    /**
     * Reward amount
     */
    Reward: PlainDescriptor<bigint>;
    /**
     * Native Asset Id
     */
    NativeCurrencyId: PlainDescriptor<number>;
    /**
     * Default account for `reward_account` and `dust_account` in genesis config.
     */
    TreasuryAccountId: PlainDescriptor<SS58String>;
  };
  OmnipoolWarehouseLM: {
    /**
     * Pallet id.
     */
    PalletId: PlainDescriptor<FixedSizeBinary<8>>;
    /**
     * Treasury account to receive claimed rewards lower than ED
     */
    TreasuryAccountId: PlainDescriptor<SS58String>;
    /**
     * Minimum total rewards to distribute from global farm during liquidity mining.
     */
    MinTotalFarmRewards: PlainDescriptor<bigint>;
    /**
     * Minimum number of periods to run liquidity mining program.
     */
    MinPlannedYieldingPeriods: PlainDescriptor<number>;
    /**
     * Maximum number of yield farms same LP shares can be re/deposited into. This value always
     * MUST BE >= 1.
     */
    MaxFarmEntriesPerDeposit: PlainDescriptor<number>;
    /**
     * Max number of yield farms can exist in global farm. This includes all farms in the
     * storage(active, stopped, terminated).
     */
    MaxYieldFarmsPerGlobalFarm: PlainDescriptor<number>;
  };
  OmnipoolLiquidityMining: {
    /**
     * NFT collection id for liquidity mining's deposit nfts.
     */
    NFTCollectionId: PlainDescriptor<bigint>;
    /**
     * Identifier of oracle data soruce
     */
    OracleSource: PlainDescriptor<FixedSizeBinary<8>>;
    /**
     * Oracle's price aggregation period.
     */
    OraclePeriod: PlainDescriptor<Anonymize<I9m0752cdvui5o>>;
  };
  OTC: {
    /**
     * Multiplier used to compute minimal amounts of asset_in and asset_out in an OTC.
     */
    ExistentialDepositMultiplier: PlainDescriptor<number>;
    /**
     * Fee deducted from amount_out.
     */
    Fee: PlainDescriptor<number>;
    /**
     * Fee receiver.
     */
    FeeReceiver: PlainDescriptor<SS58String>;
  };
  CircuitBreaker: {
    /**
     * The maximum percentage of a pool's liquidity that can be traded in a block.
     * Represented as a non-zero fraction (nominator, denominator) with the max value being 10_000.
     */
    DefaultMaxNetTradeVolumeLimitPerBlock: PlainDescriptor<
      Anonymize<I9jd27rnpm8ttv>
    >;
    /**
     * The maximum percentage of a pool's liquidity that can be added in a block.
     * Represented as an optional non-zero fraction (nominator, denominator) with the max value being 10_000.
     * If set to None, the limits are not enforced.
     */
    DefaultMaxAddLiquidityLimitPerBlock: PlainDescriptor<
      Anonymize<Iep7au1720bm0e>
    >;
    /**
     * The maximum percentage of a pool's liquidity that can be removed in a block.
     * Represented as an optional non-zero fraction (nominator, denominator) with the max value being 10_000.
     * If set to None, the limits are not enforced.
     */
    DefaultMaxRemoveLiquidityLimitPerBlock: PlainDescriptor<
      Anonymize<Iep7au1720bm0e>
    >;
  };
  Router: {
    /**
     * Native Asset Id
     */
    NativeAssetId: PlainDescriptor<number>;
    /**
     * Oracle's price aggregation period.
     */
    OraclePeriod: PlainDescriptor<Anonymize<I9m0752cdvui5o>>;
  };
  DynamicFees: {
    /**
        
         */
    AssetFeeParameters: PlainDescriptor<Anonymize<Ie5fbn0f5capo3>>;
    /**
        
         */
    ProtocolFeeParameters: PlainDescriptor<Anonymize<Ie5fbn0f5capo3>>;
  };
  Staking: {
    /**
     * Staking period length in blocks.
     */
    PeriodLength: PlainDescriptor<number>;
    /**
     * Pallet id.
     */
    PalletId: PlainDescriptor<FixedSizeBinary<8>>;
    /**
     * Native Asset ID.
     */
    NativeAssetId: PlainDescriptor<number>;
    /**
     * Min amount user must stake.
     */
    MinStake: PlainDescriptor<bigint>;
    /**
     * Weight of the time points in total points calculations.
     */
    TimePointsWeight: PlainDescriptor<number>;
    /**
     * Weight of the action points in total points calculations.
     */
    ActionPointsWeight: PlainDescriptor<number>;
    /**
     * Number of time points users receive for each period.
     */
    TimePointsPerPeriod: PlainDescriptor<number>;
    /**
     * Number of periods user can't claim rewards for. User can exit but won't receive any rewards.
     * If he stay longer than `UnclaimablePeriods` he will receive rewards also for these periods.
     */
    UnclaimablePeriods: PlainDescriptor<bigint>;
    /**
     * Weight of the actual stake in slash points calculation. Bigger the value lower the calculated slash points.
     */
    CurrentStakeWeight: PlainDescriptor<number>;
    /**
     * Max amount of votes the user can have at any time.
     */
    MaxVotes: PlainDescriptor<number>;
    /**
     * NFT collection id.
     */
    NFTCollectionId: PlainDescriptor<bigint>;
  };
  Stableswap: {
    /**
     * Minimum pool liquidity
     */
    MinPoolLiquidity: PlainDescriptor<bigint>;
    /**
     * Minimum trading amount
     */
    MinTradingLimit: PlainDescriptor<bigint>;
    /**
     * Amplification inclusive range. Pool's amp can be selected from the range only.
     */
    AmplificationRange: PlainDescriptor<Anonymize<Ia9ai1mp1viqjd>>;
  };
  Bonds: {
    /**
     * The pallet id, used for deriving its sovereign account ID.
     */
    PalletId: PlainDescriptor<FixedSizeBinary<8>>;
    /**
     * Protocol fee.
     */
    ProtocolFee: PlainDescriptor<number>;
    /**
     * Protocol fee receiver.
     */
    FeeReceiver: PlainDescriptor<SS58String>;
  };
  OtcSettlements: {
    /**
     * Account who receives the profit.
     */
    ProfitReceiver: PlainDescriptor<SS58String>;
    /**
     * Minimum profit in terms of percentage.
     */
    MinProfitPercentage: PlainDescriptor<number>;
    /**
     * Determines when we consider an arbitrage as closed.
     */
    PricePrecision: PlainDescriptor<bigint>;
    /**
     * Minimum trading limit.
     */
    MinTradingLimit: PlainDescriptor<bigint>;
    /**
     * Maximum number of iterations used in the binary search algorithm to find the trade amount.
     */
    MaxIterations: PlainDescriptor<number>;
  };
  LBP: {
    /**
     * Minimum trading limit, sole purpose of this is to keep the math working
     */
    MinTradingLimit: PlainDescriptor<bigint>;
    /**
     * Minimum pool liquidity, sole purpose of this is to keep the math working
     */
    MinPoolLiquidity: PlainDescriptor<bigint>;
    /**
     * Max fraction of pool to sell in single transaction
     */
    MaxInRatio: PlainDescriptor<bigint>;
    /**
     * Max fraction of pool to buy in single transaction
     */
    MaxOutRatio: PlainDescriptor<bigint>;
    /**
        
         */
    repay_fee: PlainDescriptor<Anonymize<I9jd27rnpm8ttv>>;
  };
  XYK: {
    /**
     * Native Asset Id
     */
    NativeAssetId: PlainDescriptor<number>;
    /**
     * Trading fee rate
     */
    GetExchangeFee: PlainDescriptor<Anonymize<I9jd27rnpm8ttv>>;
    /**
     * Minimum trading limit
     */
    MinTradingLimit: PlainDescriptor<bigint>;
    /**
     * Minimum pool liquidity
     */
    MinPoolLiquidity: PlainDescriptor<bigint>;
    /**
     * Max fraction of pool to sell in single transaction
     */
    MaxInRatio: PlainDescriptor<bigint>;
    /**
     * Max fraction of pool to buy in single transaction
     */
    MaxOutRatio: PlainDescriptor<bigint>;
    /**
     * Oracle source identifier for this pallet.
     */
    OracleSource: PlainDescriptor<FixedSizeBinary<8>>;
  };
  Referrals: {
    /**
     * ID of an asset that is used to distribute rewards in.
     */
    RewardAsset: PlainDescriptor<number>;
    /**
     * Pallet id. Determines account which holds accumulated rewards in various assets.
     */
    PalletId: PlainDescriptor<FixedSizeBinary<8>>;
    /**
     * Registration fee details.
     * (ID of an asset which fee is to be paid in, Amount, Beneficiary account)
     */
    RegistrationFee: PlainDescriptor<Anonymize<Ie4gu6f3b6uctq>>;
    /**
     * Maximum referral code length.
     */
    CodeLength: PlainDescriptor<number>;
    /**
     * Minimum referral code length.
     */
    MinCodeLength: PlainDescriptor<number>;
    /**
     * Seed amount that was sent to the reward pot.
     */
    SeedNativeAmount: PlainDescriptor<bigint>;
  };
  Liquidation: {
    /**
     * The gas limit for the execution of the liquidation call.
     */
    GasLimit: PlainDescriptor<bigint>;
    /**
     * Account who receives the profit.
     */
    ProfitReceiver: PlainDescriptor<SS58String>;
  };
  Tokens: {
    /**
        
         */
    MaxLocks: PlainDescriptor<number>;
    /**
     * The maximum number of named reserves that can exist on an account.
     */
    MaxReserves: PlainDescriptor<number>;
  };
  Currencies: {
    /**
        
         */
    GetNativeCurrencyId: PlainDescriptor<number>;
  };
  Vesting: {
    /**
     * The minimum amount transferred to call `vested_transfer`.
     */
    MinVestedTransfer: PlainDescriptor<bigint>;
  };
  EVMAccounts: {
    /**
     * Fee multiplier for the binding of addresses.
     */
    FeeMultiplier: PlainDescriptor<number>;
  };
  DynamicEvmFee: {
    /**
     * WETH Asset Id
     */
    WethAssetId: PlainDescriptor<number>;
  };
  XYKLiquidityMining: {
    /**
     * NFT collection id for liquidity mining's deposit nfts.
     */
    NFTCollectionId: PlainDescriptor<bigint>;
  };
  XYKWarehouseLM: {
    /**
     * Pallet id.
     */
    PalletId: PlainDescriptor<FixedSizeBinary<8>>;
    /**
     * Treasury account to receive claimed rewards lower than ED
     */
    TreasuryAccountId: PlainDescriptor<SS58String>;
    /**
     * Minimum total rewards to distribute from global farm during liquidity mining.
     */
    MinTotalFarmRewards: PlainDescriptor<bigint>;
    /**
     * Minimum number of periods to run liquidity mining program.
     */
    MinPlannedYieldingPeriods: PlainDescriptor<number>;
    /**
     * Maximum number of yield farms same LP shares can be re/deposited into. This value always
     * MUST BE >= 1.
     */
    MaxFarmEntriesPerDeposit: PlainDescriptor<number>;
    /**
     * Max number of yield farms can exist in global farm. This includes all farms in the
     * storage(active, stopped, terminated).
     */
    MaxYieldFarmsPerGlobalFarm: PlainDescriptor<number>;
  };
  DCA: {
    /**
     *Max price difference allowed between blocks
     */
    MaxPriceDifferenceBetweenBlocks: PlainDescriptor<number>;
    /**
     *Max configurable price difference allowed between blocks
     */
    MaxConfigurablePriceDifferenceBetweenBlocks: PlainDescriptor<number>;
    /**
     *The number of max schedules to be executed per block
     */
    MaxSchedulePerBlock: PlainDescriptor<number>;
    /**
     *The number of max retries in case of trade limit error
     */
    MaxNumberOfRetriesOnError: PlainDescriptor<number>;
    /**
     *Minimal period between executions
     */
    MinimalPeriod: PlainDescriptor<number>;
    /**
     *Chance of the random rescheduling
     */
    BumpChance: PlainDescriptor<number>;
    /**
     * Minimum trading limit for a single trade
     */
    MinimumTradingLimit: PlainDescriptor<bigint>;
    /**
     * Native Asset Id
     */
    NativeAssetId: PlainDescriptor<number>;
    /**
     * Polkadot Native Asset Id (DOT)
     */
    PolkadotNativeAssetId: PlainDescriptor<number>;
    /**
     *Minimum budget to be able to schedule a DCA, specified in native currency
     */
    MinBudgetInNativeCurrency: PlainDescriptor<bigint>;
    /**
     *The fee receiver for transaction fees
     */
    FeeReceiver: PlainDescriptor<SS58String>;
    /**
     * Named reserve identifier to store named reserves for orders of each users
     */
    NamedReserveId: PlainDescriptor<FixedSizeBinary<8>>;
  };
  Scheduler: {
    /**
     * The maximum weight that may be scheduled per block for any dispatchables.
     */
    MaximumWeight: PlainDescriptor<Anonymize<I4q39t5hn830vp>>;
    /**
     * The maximum number of scheduled calls in the queue for a single block.
     *
     * NOTE:
     * + Dependent pallets' benchmarks might require a higher limit for the setting. Set a
     * higher limit under `runtime-benchmarks` feature.
     */
    MaxScheduledPerBlock: PlainDescriptor<number>;
  };
  ParachainSystem: {
    /**
     * Returns the parachain ID we are running with.
     */
    SelfParaId: PlainDescriptor<number>;
  };
  XcmpQueue: {
    /**
     * The maximum number of inbound XCMP channels that can be suspended simultaneously.
     *
     * Any further channel suspensions will fail and messages may get dropped without further
     * notice. Choosing a high value (1000) is okay; the trade-off that is described in
     * [`InboundXcmpSuspended`] still applies at that scale.
     */
    MaxInboundSuspended: PlainDescriptor<number>;
  };
  MessageQueue: {
    /**
     * The size of the page; this implies the maximum message size which can be sent.
     *
     * A good value depends on the expected message sizes, their weights, the weight that is
     * available for processing them and the maximal needed message size. The maximal message
     * size is slightly lower than this as defined by [`MaxMessageLenOf`].
     */
    HeapSize: PlainDescriptor<number>;
    /**
     * The maximum number of stale pages (i.e. of overweight messages) allowed before culling
     * can happen. Once there are more stale pages than this, then historical pages may be
     * dropped, even if they contain unprocessed overweight messages.
     */
    MaxStale: PlainDescriptor<number>;
    /**
     * The amount of weight (if any) which should be provided to the message queue for
     * servicing enqueued items `on_initialize`.
     *
     * This may be legitimately `None` in the case that you will call
     * `ServiceQueues::service_queues` manually or set [`Self::IdleMaxServiceWeight`] to have
     * it run in `on_idle`.
     */
    ServiceWeight: PlainDescriptor<Anonymize<Iasb8k6ash5mjn>>;
    /**
     * The maximum amount of weight (if any) to be used from remaining weight `on_idle` which
     * should be provided to the message queue for servicing enqueued items `on_idle`.
     * Useful for parachains to process messages at the same block they are received.
     *
     * If `None`, it will not call `ServiceQueues::service_queues` in `on_idle`.
     */
    IdleMaxServiceWeight: PlainDescriptor<Anonymize<Iasb8k6ash5mjn>>;
  };
  XTokens: {
    /**
     * Self chain location.
     */
    SelfLocation: PlainDescriptor<Anonymize<I4c0s5cioidn76>>;
    /**
     * Base XCM weight.
     *
     * The actually weight for an XCM message is `T::BaseXcmWeight +
     * T::Weigher::weight(&msg)`.
     */
    BaseXcmWeight: PlainDescriptor<Anonymize<I4q39t5hn830vp>>;
    /**
     * The id of the RateLimiter.
     */
    RateLimiterId: PlainDescriptor<undefined>;
  };
  Aura: {
    /**
     * The slot duration Aura should run with, expressed in milliseconds.
     * The effective value of this type should not change while the chain is running.
     *
     * For backwards compatibility either use [`MinimumPeriodTimesTwo`] or a const.
     */
    SlotDuration: PlainDescriptor<bigint>;
  };
  EmaOracle: {
    /**
     * Maximum number of unique oracle entries expected in one block.
     */
    MaxUniqueEntries: PlainDescriptor<number>;
  };
};
type IRuntimeCalls = {
  /**
   * The `Core` runtime api that every Substrate runtime needs to implement.
   */
  Core: {
    /**
     * Returns the version of the runtime.
     */
    version: RuntimeDescriptor<[], Anonymize<Ic6nglu2db2c36>>;
    /**
     * Execute the given block.
     */
    execute_block: RuntimeDescriptor<
      [block: Anonymize<Iaqet9jc3ihboe>],
      undefined
    >;
    /**
     * Initialize a block with the given header and return the runtime executive mode.
     */
    initialize_block: RuntimeDescriptor<
      [header: Anonymize<Ic952bubvq4k7d>],
      Anonymize<I2v50gu3s1aqk6>
    >;
  };
  /**
   * The `Metadata` api trait that returns metadata for the runtime.
   */
  Metadata: {
    /**
     * Returns the metadata of a runtime.
     */
    metadata: RuntimeDescriptor<[], Binary>;
    /**
     * Returns the metadata at a given version.
     *
     * If the given `version` isn't supported, this will return `None`.
     * Use [`Self::metadata_versions`] to find out about supported metadata version of the runtime.
     */
    metadata_at_version: RuntimeDescriptor<
      [version: number],
      Anonymize<Iabpgqcjikia83>
    >;
    /**
     * Returns the supported metadata versions.
     *
     * This can be used to call `metadata_at_version`.
     */
    metadata_versions: RuntimeDescriptor<[], Anonymize<Icgljjb6j82uhn>>;
  };
  /**
   * The `BlockBuilder` api trait that provides the required functionality for building a block.
   */
  BlockBuilder: {
    /**
     * Apply the given extrinsic.
     *
     * Returns an inclusion outcome which specifies if this extrinsic is included in
     * this block or not.
     */
    apply_extrinsic: RuntimeDescriptor<
      [extrinsic: Binary],
      Anonymize<I1202o7g6hne7p>
    >;
    /**
     * Finish the current block.
     */
    finalize_block: RuntimeDescriptor<[], Anonymize<Ic952bubvq4k7d>>;
    /**
     * Generate inherent extrinsics. The inherent data will vary from chain to chain.
     */
    inherent_extrinsics: RuntimeDescriptor<
      [inherent: Anonymize<If7uv525tdvv7a>],
      Anonymize<Itom7fk49o0c9>
    >;
    /**
     * Check that the inherents are valid. The inherent data will vary from chain to chain.
     */
    check_inherents: RuntimeDescriptor<
      [block: Anonymize<Iaqet9jc3ihboe>, data: Anonymize<If7uv525tdvv7a>],
      Anonymize<I2an1fs2eiebjp>
    >;
  };
  /**
   * The `TaggedTransactionQueue` api trait for interfering with the transaction queue.
   */
  TaggedTransactionQueue: {
    /**
     * Validate the transaction.
     *
     * This method is invoked by the transaction pool to learn details about given transaction.
     * The implementation should make sure to verify the correctness of the transaction
     * against current state. The given `block_hash` corresponds to the hash of the block
     * that is used as current state.
     *
     * Note that this call may be performed by the pool multiple times and transactions
     * might be verified in any possible order.
     */
    validate_transaction: RuntimeDescriptor<
      [
        source: TransactionValidityTransactionSource,
        tx: Binary,
        block_hash: FixedSizeBinary<32>,
      ],
      Anonymize<Iajbob6uln5jct>
    >;
  };
  /**
   * The offchain worker api.
   */
  OffchainWorkerApi: {
    /**
     * Starts the off-chain task for given block header.
     */
    offchain_worker: RuntimeDescriptor<
      [header: Anonymize<Ic952bubvq4k7d>],
      undefined
    >;
  };
  /**
   * Session keys runtime api.
   */
  SessionKeys: {
    /**
     * Generate a set of session keys with optionally using the given seed.
     * The keys should be stored within the keystore exposed via runtime
     * externalities.
     *
     * The seed needs to be a valid `utf8` string.
     *
     * Returns the concatenated SCALE encoded public keys.
     */
    generate_session_keys: RuntimeDescriptor<
      [seed: Anonymize<Iabpgqcjikia83>],
      Binary
    >;
    /**
     * Decode the given public session keys.
     *
     * Returns the list of public raw public keys + key type.
     */
    decode_session_keys: RuntimeDescriptor<
      [encoded: Binary],
      Anonymize<Icerf8h8pdu8ss>
    >;
  };
  /**
   * API necessary for block authorship with aura.
   */
  AuraApi: {
    /**
     * Returns the slot duration for Aura.
     *
     * Currently, only the value provided by this type at genesis will be used.
     */
    slot_duration: RuntimeDescriptor<[], bigint>;
    /**
     * Return the current set of authorities.
     */
    authorities: RuntimeDescriptor<[], Anonymize<Ic5m5lp1oioo8r>>;
  };
  /**
   * Runtime api to collect information about a collation.
   */
  CollectCollationInfo: {
    /**
     * Collect information about a collation.
     *
     * The given `header` is the header of the built block for that
     * we are collecting the collation info for.
     */
    collect_collation_info: RuntimeDescriptor<
      [header: Anonymize<Ic952bubvq4k7d>],
      Anonymize<Ic1d4u2opv3fst>
    >;
  };
  /**
    
     */
  CurrenciesApi: {
    /**
        
         */
    account: RuntimeDescriptor<
      [asset_id: number, who: SS58String],
      Anonymize<Ic02kut0350gb0>
    >;
    /**
        
         */
    accounts: RuntimeDescriptor<[who: SS58String], Anonymize<I4g15ko4u63fja>>;
    /**
        
         */
    free_balance: RuntimeDescriptor<
      [asset_id: number, who: SS58String],
      bigint
    >;
  };
  /**
   * The API to query account nonce.
   */
  AccountNonceApi: {
    /**
     * Get current account nonce of given `AccountId`.
     */
    account_nonce: RuntimeDescriptor<[account: SS58String], number>;
  };
  /**
    
     */
  TransactionPaymentApi: {
    /**
        
         */
    query_info: RuntimeDescriptor<
      [uxt: Binary, len: number],
      Anonymize<I6spmpef2c7svf>
    >;
    /**
        
         */
    query_fee_details: RuntimeDescriptor<
      [uxt: Binary, len: number],
      Anonymize<Iei2mvq0mjvt81>
    >;
    /**
        
         */
    query_weight_to_fee: RuntimeDescriptor<
      [weight: Anonymize<I4q39t5hn830vp>],
      bigint
    >;
    /**
        
         */
    query_length_to_fee: RuntimeDescriptor<[length: number], bigint>;
  };
  /**
   * API necessary for Ethereum-compatibility layer.
   */
  EthereumRuntimeRPCApi: {
    /**
     * Returns runtime defined pallet_evm::ChainId.
     */
    chain_id: RuntimeDescriptor<[], bigint>;
    /**
     * Returns pallet_evm::Accounts by address.
     */
    account_basic: RuntimeDescriptor<
      [address: FixedSizeBinary<20>],
      Anonymize<If08sfhqn8ujfr>
    >;
    /**
     * Returns FixedGasPrice::min_gas_price
     */
    gas_price: RuntimeDescriptor<[], Anonymize<I4totqt881mlti>>;
    /**
     * For a given account address, returns pallet_evm::AccountCodes.
     */
    account_code_at: RuntimeDescriptor<[address: FixedSizeBinary<20>], Binary>;
    /**
     * Returns the converted FindAuthor::find_author authority id.
     */
    author: RuntimeDescriptor<[], FixedSizeBinary<20>>;
    /**
     * For a given account address and index, returns pallet_evm::AccountStorages.
     */
    storage_at: RuntimeDescriptor<
      [address: FixedSizeBinary<20>, index: Anonymize<I4totqt881mlti>],
      FixedSizeBinary<32>
    >;
    /**
        
         */
    call: RuntimeDescriptor<
      [
        from: FixedSizeBinary<20>,
        to: FixedSizeBinary<20>,
        data: Binary,
        value: Anonymize<I4totqt881mlti>,
        gas_limit: Anonymize<I4totqt881mlti>,
        max_fee_per_gas: Anonymize<Ic4rgfgksgmm3e>,
        max_priority_fee_per_gas: Anonymize<Ic4rgfgksgmm3e>,
        nonce: Anonymize<Ic4rgfgksgmm3e>,
        estimate: boolean,
        access_list: Anonymize<I3dj14b7k3rkm5>,
      ],
      Anonymize<I5ahnvkd6fugsq>
    >;
    /**
        
         */
    create: RuntimeDescriptor<
      [
        from: FixedSizeBinary<20>,
        data: Binary,
        value: Anonymize<I4totqt881mlti>,
        gas_limit: Anonymize<I4totqt881mlti>,
        max_fee_per_gas: Anonymize<Ic4rgfgksgmm3e>,
        max_priority_fee_per_gas: Anonymize<Ic4rgfgksgmm3e>,
        nonce: Anonymize<Ic4rgfgksgmm3e>,
        estimate: boolean,
        access_list: Anonymize<I3dj14b7k3rkm5>,
      ],
      Anonymize<I370s3chedlj9o>
    >;
    /**
     * Return the current block.
     */
    current_block: RuntimeDescriptor<[], Anonymize<Ifogockjiq4b3>>;
    /**
     * Return the current receipt.
     */
    current_receipts: RuntimeDescriptor<[], Anonymize<I2r0n4gcrs974b>>;
    /**
     * Return the current transaction status.
     */
    current_transaction_statuses: RuntimeDescriptor<
      [],
      Anonymize<Ie6kgk6f04rsvk>
    >;
    /**
        
         */
    current_all: RuntimeDescriptor<[], Anonymize<Ibkook56hopvp8>>;
    /**
     * Receives a `Vec<OpaqueExtrinsic>` and filters all the ethereum transactions.
     */
    extrinsic_filter: RuntimeDescriptor<
      [xts: Anonymize<Itom7fk49o0c9>],
      Anonymize<I1fl9qh2r1hf29>
    >;
    /**
     * Return the elasticity multiplier.
     */
    elasticity: RuntimeDescriptor<[], Anonymize<I4arjljr6dpflb>>;
    /**
     * Used to determine if gas limit multiplier for non-transactional calls (eth_call/estimateGas)
     * is supported.
     */
    gas_limit_multiplier_support: RuntimeDescriptor<[], undefined>;
    /**
     * Return the pending block.
     */
    pending_block: RuntimeDescriptor<
      [xts: Anonymize<Itom7fk49o0c9>],
      Anonymize<I45rl58hfs7m0h>
    >;
    /**
     * initialize the pending block
     */
    initialize_pending_block: RuntimeDescriptor<
      [header: Anonymize<Ic952bubvq4k7d>],
      undefined
    >;
  };
  /**
    
     */
  ConvertTransactionRuntimeApi: {
    /**
        
         */
    convert_transaction: RuntimeDescriptor<
      [transaction: Anonymize<I6fr2mqud652ga>],
      Binary
    >;
  };
  /**
   * The API to query EVM account conversions.
   */
  EvmAccountsApi: {
    /**
     * get the EVM address from the substrate address.
     */
    evm_address: RuntimeDescriptor<
      [account_id: SS58String],
      FixedSizeBinary<20>
    >;
    /**
     * Return the Substrate address bound to the EVM account. If not bound, returns `None`.
     */
    bound_account_id: RuntimeDescriptor<
      [evm_address: FixedSizeBinary<20>],
      Anonymize<Ihfphjolmsqq1>
    >;
    /**
     * Get the Substrate address from the EVM address.
     * Returns the truncated version of the address if the address wasn't bind.
     */
    account_id: RuntimeDescriptor<
      [evm_address: FixedSizeBinary<20>],
      SS58String
    >;
  };
  /**
   * A trait of XCM payment API.
   *
   * API provides functionality for obtaining:
   *
   * * the weight required to execute an XCM message,
   * * a list of acceptable `AssetId`s for message execution payment,
   * * the cost of the weight in the specified acceptable `AssetId`.
   * * the fees for an XCM message delivery.
   *
   * To determine the execution weight of the calls required for
   * [`xcm::latest::Instruction::Transact`] instruction, `TransactionPaymentCallApi` can be used.
   */
  XcmPaymentApi: {
    /**
     * Returns a list of acceptable payment assets.
     *
     * # Arguments
     *
     * * `xcm_version`: Version.
     */
    query_acceptable_payment_assets: RuntimeDescriptor<
      [xcm_version: number],
      Anonymize<I1p1369d52j8jd>
    >;
    /**
     * Returns a weight needed to execute a XCM.
     *
     * # Arguments
     *
     * * `message`: `VersionedXcm`.
     */
    query_xcm_weight: RuntimeDescriptor<
      [message: XcmVersionedXcm],
      Anonymize<Ic0c3req3mlc1l>
    >;
    /**
     * Converts a weight into a fee for the specified `AssetId`.
     *
     * # Arguments
     *
     * * `weight`: convertible `Weight`.
     * * `asset`: `VersionedAssetId`.
     */
    query_weight_to_asset_fee: RuntimeDescriptor<
      [weight: Anonymize<I4q39t5hn830vp>, asset: XcmVersionedAssetId],
      Anonymize<I7ocn4njqde3v5>
    >;
    /**
     * Get delivery fees for sending a specific `message` to a `destination`.
     * These always come in a specific asset, defined by the chain.
     *
     * # Arguments
     * * `message`: The message that'll be sent, necessary because most delivery fees are based on the
     *   size of the message.
     * * `destination`: The destination to send the message to. Different destinations may use
     *   different senders that charge different fees.
     */
    query_delivery_fees: RuntimeDescriptor<
      [destination: XcmVersionedLocation, message: XcmVersionedXcm],
      Anonymize<I5rlt6h8ph553n>
    >;
  };
  /**
   * API to interact with RuntimeGenesisConfig for the runtime
   */
  GenesisBuilder: {
    /**
     * Build `RuntimeGenesisConfig` from a JSON blob not using any defaults and store it in the
     * storage.
     *
     * In the case of a FRAME-based runtime, this function deserializes the full `RuntimeGenesisConfig` from the given JSON blob and
     * puts it into the storage. If the provided JSON blob is incorrect or incomplete or the
     * deserialization fails, an error is returned.
     *
     * Please note that provided JSON blob must contain all `RuntimeGenesisConfig` fields, no
     * defaults will be used.
     */
    build_state: RuntimeDescriptor<[json: Binary], Anonymize<Ie9sr1iqcg3cgm>>;
    /**
     * Returns a JSON blob representation of the built-in `RuntimeGenesisConfig` identified by
     * `id`.
     *
     * If `id` is `None` the function returns JSON blob representation of the default
     * `RuntimeGenesisConfig` struct of the runtime. Implementation must provide default
     * `RuntimeGenesisConfig`.
     *
     * Otherwise function returns a JSON representation of the built-in, named
     * `RuntimeGenesisConfig` preset identified by `id`, or `None` if such preset does not
     * exists. Returned `Vec<u8>` contains bytes of JSON blob (patch) which comprises a list of
     * (potentially nested) key-value pairs that are intended for customizing the default
     * runtime genesis config. The patch shall be merged (rfc7386) with the JSON representation
     * of the default `RuntimeGenesisConfig` to create a comprehensive genesis config that can
     * be used in `build_state` method.
     */
    get_preset: RuntimeDescriptor<
      [id: Anonymize<I1mqgk2tmnn9i2>],
      Anonymize<Iabpgqcjikia83>
    >;
    /**
     * Returns a list of identifiers for available builtin `RuntimeGenesisConfig` presets.
     *
     * The presets from the list can be queried with [`GenesisBuilder::get_preset`] method. If
     * no named presets are provided by the runtime the list is empty.
     */
    preset_names: RuntimeDescriptor<[], Anonymize<I6lr8sctk0bi4e>>;
  };
};
type IAsset = PlainDescriptor<void>;
export type HydrationDispatchError = Anonymize<I9sdjnqgsnrang>;
type PalletsTypedef = {
  __storage: IStorage;
  __tx: ICalls;
  __event: IEvent;
  __error: IError;
  __const: IConstants;
};
type IDescriptors = {
  descriptors: {
    pallets: PalletsTypedef;
    apis: IRuntimeCalls;
  } & Promise<any>;
  metadataTypes: Promise<Uint8Array>;
  asset: IAsset;
};
declare const _allDescriptors: IDescriptors;
export default _allDescriptors;
export type HydrationQueries = QueryFromPalletsDef<PalletsTypedef>;
export type HydrationCalls = TxFromPalletsDef<PalletsTypedef>;
export type HydrationEvents = EventsFromPalletsDef<PalletsTypedef>;
export type HydrationErrors = ErrorsFromPalletsDef<PalletsTypedef>;
export type HydrationConstants = ConstFromPalletsDef<PalletsTypedef>;
export type HydrationCallData = Anonymize<I3334u30i909c2> & {
  value: {
    type: string;
  };
};
export type HydrationWhitelistEntry =
  | PalletKey
  | ApiKey<IRuntimeCalls>
  | `query.${NestedKey<PalletsTypedef['__storage']>}`
  | `tx.${NestedKey<PalletsTypedef['__tx']>}`
  | `event.${NestedKey<PalletsTypedef['__event']>}`
  | `error.${NestedKey<PalletsTypedef['__error']>}`
  | `const.${NestedKey<PalletsTypedef['__const']>}`;
type PalletKey =
  `*.${keyof (IStorage & ICalls & IEvent & IError & IConstants & IRuntimeCalls)}`;
type NestedKey<D extends Record<string, Record<string, any>>> =
  | '*'
  | {
      [P in keyof D & string]:
        | `${P}.*`
        | {
            [N in keyof D[P] & string]: `${P}.${N}`;
          }[keyof D[P] & string];
    }[keyof D & string];
type ApiKey<D extends Record<string, Record<string, any>>> =
  | 'api.*'
  | {
      [P in keyof D & string]:
        | `api.${P}.*`
        | {
            [N in keyof D[P] & string]: `api.${P}.${N}`;
          }[keyof D[P] & string];
    }[keyof D & string];
