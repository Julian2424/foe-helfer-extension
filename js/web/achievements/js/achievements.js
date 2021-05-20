/*
 * **************************************************************************************
 * Copyright (C) 2021 FoE-Helper team - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the AGPL license.
 *
 * See file LICENSE.md or go to
 * https://github.com/dsiekiera/foe-helfer-extension/blob/master/LICENSE.md
 * for full license details.
 *
 * **************************************************************************************
 */



 FoEproxy.addHandler('AchievementsService', 'getOverview', async (data, postData) => {
	
    Achievements.Show();
	console.log("Proxy");
});
let Achievements={
	 /**
	 * Build HUD
	 */
	Show: () => {

        Achievements.Box();
    },

    /**
     * Erzeugt die Box wenn noch nicht im DOM
     *
     */
    Box: () => {

        // Wenn die Box noch nicht da ist, neu erzeugen und in den DOM packen
        if ($('#AchievementsInfo').length === 0) {

            HTML.Box({
                id: 'AchievementsInfo',
                title: i18n('Boxes.Achievements.Title'),
                auto_close: true,
                dragdrop: true,
                resize: true,
                minimize: true
            });
       
            // CSS in den DOM prügeln
            HTML.AddCssFile('achievements');
             $('#AchievementsBody').html(`${i18n('Boxes.mapTradeWarning.Text')}`);

        } else {
            return HTML.CloseOpenBox('AchievementsInfo');
        }
    },
}