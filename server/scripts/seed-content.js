const { client } = require('../config/db');
const Page = require('../models/Page');
const Course = require('../models/Course');
const Event = require('../models/Event');

const homeHtml = `<div class="overflow-hidden bg-white py-24 sm:py-32">
  <div class="mx-auto max-w-7xl px-6 lg:px-8">
    <div
      class="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2"
    >
      <div class="lg:pt-4 lg:pr-8">
        <div class="lg:max-w-lg">
          <h2 class="text-base/7 font-semibold text-indigo-400">Deploy faster</h2>
          <p class="mt-2 text-4xl font-semibold tracking-tight text-pretty text-black sm:text-5xl">
            Die Profis für Online-Unterricht
          </p>
          <p class="mt-6 text-lg/8 text-black">
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Maiores impedit perferendis
            suscipit eaque, iste dolor cupiditate blanditiis ratione.
          </p>
          <dl class="mt-10 max-w-xl space-y-8 text-base/7 text-black lg:max-w-none">
            <div class="relative pl-9">
              <dt class="inline font-semibold text-black">
                <svg
                  class="absolute top-1 left-1 size-5 text-indigo-400"
                  si-cloud-arrow-up-icon
                ></svg>
                Push to deploy.
              </dt>
              <dd class="inline">
                Lorem ipsum, dolor sit amet consectetur adipisicing elit. Maiores impedit
                perferendis suscipit eaque, iste dolor cupiditate blanditiis ratione.
              </dd>
            </div>
            <div class="relative pl-9">
              <dt class="inline font-semibold text-black">
                <svg class="absolute top-1 left-1 size-5 text-indigo-400" si-lock-closed-icon></svg>

                SSL certificates.
              </dt>
              <dd class="inline">
                Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat
                commodo.
              </dd>
            </div>
            <div class="relative pl-9">
              <dt class="inline font-semibold text-black">

                    <svg class="absolute top-1 left-1 size-5 text-indigo-400" si-inbox-stack-icon></svg>

                Database backups.
              </dt>
              <dd class="inline">
                Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi
                lobortis.
              </dd>
            </div>
            <a
              routerLink="/auth/login"
              class="bg-red-500 text-white text-center rounded-sm cursor-pointer px-3 py-2 hover:bg-red-700"
            >
              <span class="text-center">Book a class now</span>
            </a>
          </dl>
        </div>
      </div>
      <img
        width="2432"
        height="1442"
        src="/assets/Bild1_Home.png"
        alt="Product screenshot"
        class="w-3xl max-w-none rounded-xl shadow-xl ring-1 ring-white/10 sm:w-228 md:-ml-4 lg:-ml-0"
      />
    </div>
  </div>

  <div class="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
    <h2 class="text-4xl font-semibold tracking-tight text-black sm:text-5xl mb-12 text-center">What Language Do You Want to Learn?</h2>
    <div class="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-10 lg:mx-0 lg:max-w-none lg:grid-cols-2">
      <div class="rounded-xl shadow-lg ring-1 ring-gray-200 p-8 hover:shadow-2xl hover:bg-red-500 hover:ring-red-500 hover:scale-105 transition-all duration-300 cursor-pointer group">
        <h3 class="text-2xl font-semibold text-black group-hover:text-white mb-4">English</h3>
        <p class="text-lg text-gray-600 group-hover:text-white">Learn English with our expert tutors.</p>
      </div>
      <div class="rounded-xl shadow-lg ring-1 ring-gray-200 p-8 hover:shadow-2xl hover:bg-red-500 hover:ring-red-500 hover:scale-105 transition-all duration-300 cursor-pointer group">
        <h3 class="text-2xl font-semibold text-black group-hover:text-white mb-4">German</h3>
        <p class="text-lg text-gray-600 group-hover:text-white">Learn German with our expert tutors.</p>
      </div>
    </div>
  </div>


  <div class="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
    <h2 class="text-4xl font-semibold tracking-tight text-black sm:text-5xl mb-12 text-center">Not Sure which course suits you?</h2>
    <div class="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-10 lg:mx-0 lg:max-w-none lg:grid-cols-2">
      <div class="rounded-xl shadow-lg ring-1 ring-gray-200 p-8">
      <h3 class="text-2xl font-semibold text-black mb-4">Beginner</h3>
      <p class="text-lg text-gray-600 mb-6">Start your language learning journey from scratch.</p>
      <ul class="space-y-3 mb-8">
        <li class="flex items-center text-gray-700">
        <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
        Foundational grammar and vocabulary
        </li>
        <li class="flex items-center text-gray-700">
        <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
        Interactive speaking practice
        </li>
        <li class="flex items-center text-gray-700">
        <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
        Weekly progress assessments
        </li>
      </ul>
      <button class="w-full bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Start Beginner Course</button>
      </div>
      <div class="rounded-xl shadow-lg ring-1 ring-gray-200 p-8">
      <h3 class="text-2xl font-semibold text-black mb-4">Advanced</h3>
      <p class="text-lg text-gray-600 mb-6">Enhance your existing language skills to fluency.</p>
      <ul class="space-y-3 mb-8">
        <li class="flex items-center text-gray-700">
        <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
        Advanced conversation and debate
        </li>
        <li class="flex items-center text-gray-700">
        <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
        Business language modules
        </li>
        <li class="flex items-center text-gray-700">
        <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
        Certification preparation
        </li>
      </ul>
      <button class="w-full bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">Start Advanced Course</button>
      </div>
    </div>


  </div>

</div>`;

const aboutHtml = `<section class="pt-10 overflow-hidden bg-white dark:bg-gray-900">
    <div class="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl">
        <div class="grid items-center grid-cols-1 md:grid-cols-2">

            <div>
                <h2 class="text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl lg:text-5xl">Hey 👋 I
                    am
                    <br class="block sm:hidden" />Fulya Mank
                </h2>
                <p class="max-w-lg mt-3 text-xl leading-relaxed text-gray-600 dark:text-gray-300 md:mt-8">
                     Inhaberin der Sprachschule Mank und die Leiterin der Sprachkurse. Geboren und aufgewachsen bin ich in der schönen Domstadt Limburg an der Lahn.
                </p>

                <p class="mt-4 text-xl text-gray-600 dark:text-gray-300 md:mt-8">
                    <span class="relative inline-block">
                        <span class="absolute inline-block w-full bottom-0.5 h-2 bg-yellow-300 dark:bg-gray-900"></span>
                    <span class="relative"> Have a question? </span>
                    </span>
                    <br class="block sm:hidden" />Ask me on <a href="#" title=""
                        class="transition-all duration-200 text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-500 hover:underline">Twitter</a>
                </p>
            </div>

            <div class="relative">
                <img class="absolute inset-x-0 bottom-0 -mb-48 -translate-x-1/2 left-1/2" src="https://cdn.rareblocks.xyz/collection/celebration/images/team/1/blob-shape.svg" alt="" />

                <img class="relative w-full xl:max-w-lg xl:mx-auto 2xl:origin-bottom 2xl:scale-110" src="https://cdn.rareblocks.xyz/collection/celebration/images/team/1/business-woman.png" alt="" />
            </div>

        </div>
    </div>
</section>
<section class="py-10 overflow-hidden bg-white dark:bg-gray-900">
    <div class="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl">
        <h2 class="text-3xl font-bold leading-tight text-black dark:text-white underline decoration-yellow-300 decoration-4">Ich bin zertifizierte Dozentin für</h2>
        <ul class="mt-4 text-xl text-gray-600 dark:text-gray-300 list-disc list-inside">
            <li class="mt-2">Deutsch</li>
            <li class="mt-2">Deutsch für Medizin</li>
            <li class="mt-2">Deutsch für Zahnmedizin</li>
            <li class="mt-2">Live-Online Unterricht</li>
        </ul>
        <p class="mt-4 text-xl leading-relaxed text-gray-600 dark:text-gray-300">
            Des Weiteren bin ich seit über 10 Jahren Cambridge-CELTA-zertifizierte Lehrerin für Englisch und zertifizierte Übersetzerin für Englisch und Deutsch. Ich unterrichte mit modernen Methoden und aktuellem Unterrichtsmaterial. Durch meine jahrelange Erfahrung kann ich auch spontan auf Fragen im Unterricht eingehen. Die Sprache und vor allem das Unterrichten bereiten mir große Freude, die ich sehr gerne an die Teilnehmenden im Unterricht weitergebe. Schnuppern Sie einfach mal in den Unterricht rein und machen Sie sich selbst einen Eindruck. Oder klicken Sie eines der Videos vom Unterricht an. Ich freue mich auf Sie!
        </p>
        <h3 class="mt-6 text-2xl font-bold text-black dark:text-white border-b-2 border-yellow-300 pb-2">Meine Kolleg*innen</h3>
        <p class="mt-4 text-xl leading-relaxed text-gray-600 dark:text-gray-300">
            Natürlich habe ich auch Kolleginnen und Kollegen, die mich beim Unterrichten unterstützen und in meiner Abwesenheit vertreten. In meiner Sprachschule unterrichten nur erfahrene Lehrerinnen und Lehrer.
        </p>
    </div>
</section>`;

const mediaHtml = `<section class="py-20 bg-white">
  <div class="container mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-rose-600 font-semibold">OUR GALLERY</span>
      <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mt-4">Captured Moments</h2>
      <p class="max-w-2xl mx-auto text-gray-600 mt-6 text-lg">A visual journey through our most memorable events and projects</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div class="group relative overflow-hidden rounded-lg aspect-square">
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
          alt="Concert crowd"
          class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <div class="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 class="text-white text-xl font-bold">Annual Music Festival</h3>
            <p class="text-white/80 mt-1">June 2023</p>
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-lg aspect-square">
        <img
          src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
          alt="Team building"
          class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <div class="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 class="text-white text-xl font-bold">Team Retreat</h3>
            <p class="text-white/80 mt-1">May 2023</p>
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-lg aspect-square">
        <img
          src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
          alt="Office meeting"
          class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <div class="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 class="text-white text-xl font-bold">Strategy Workshop</h3>
            <p class="text-white/80 mt-1">April 2023</p>
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-lg aspect-square">
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
          alt="Team celebration"
          class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <div class="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 class="text-white text-xl font-bold">Product Launch</h3>
            <p class="text-white/80 mt-1">March 2023</p>
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-lg aspect-square">
        <img
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
          alt="Conference"
          class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <div class="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 class="text-white text-xl font-bold">Industry Conference</h3>
            <p class="text-white/80 mt-1">February 2023</p>
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-lg aspect-square">
        <img
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
          alt="Volunteering"
          class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <div class="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 class="text-white text-xl font-bold">Community Service</h3>
            <p class="text-white/80 mt-1">January 2023</p>
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-lg aspect-square">
        <img
          src="https://images.unsplash.com/photo-1542626991-cbc4e32524cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
          alt="Award ceremony"
          class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <div class="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 class="text-white text-xl font-bold">Awards Night</h3>
            <p class="text-white/80 mt-1">December 2022</p>
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-lg aspect-square">
        <img
          src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
          alt="Office party"
          class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
          <div class="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 class="text-white text-xl font-bold">Holiday Party</h3>
            <p class="text-white/80 mt-1">November 2022</p>
          </div>
        </div>
      </div>
    </div>

    <div class="text-center mt-16">
      <button class="px-8 py-3 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors shadow-lg">
        Load More Photos
      </button>
    </div>
  </div>
</section>`;

const contactHtml = `<div class="bg-white py-24 sm:py-32">
  <div class="mx-auto max-w-7xl px-6 lg:px-8">
    <div
      class="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2"
    >
      <div class="lg:pt-4 lg:pr-8">
        <div class="lg:max-w-lg">
          <div
            class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          ></div>
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Contact Us</h2>
          </div>
          <form method="post" class="mx-auto mt-16 max-w-xl sm:mt-20">
            <div class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <label for="first-name" class="block text-sm font-semibold leading-6 text-gray-900"
                  >First name</label
                >
                <div class="mt-2.5">
                  <input
                    type="text"
                    name="first-name"
                    id="first-name"
                    autocomplete="given-name"
                    class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div>
                <label for="last-name" class="block text-sm font-semibold leading-6 text-gray-900"
                  >Last name</label
                >
                <div class="mt-2.5">
                  <input
                    type="text"
                    name="last-name"
                    id="last-name"
                    autocomplete="family-name"
                    class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div class="sm:col-span-2">
                <label for="email" class="block text-sm font-semibold leading-6 text-gray-900"
                  >Email</label
                >
                <div class="mt-2.5">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    autocomplete="email"
                    class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div class="sm:col-span-2">
                <label
                  for="phone-number"
                  class="block text-sm font-semibold leading-6 text-gray-900"
                  >Phone number</label
                >
                <div class="relative mt-2.5">
                  <div class="absolute inset-y-0 left-0 flex items-center">
                    <label for="country" class="sr-only">Country</label>
                    <select
                      id="country"
                      name="country"
                      class="h-full rounded-md border-0 bg-transparent bg-none py-0 pl-4 pr-9 text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                    >
                      <option>49</option>
                    </select>
                    <svg
                      class="pointer-events-none absolute right-3 top-0 h-full w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    name="phone-number"
                    id="phone-number"
                    autocomplete="tel"
                    class="block w-full rounded-md border-0 px-3.5 py-2 pl-20 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div class="sm:col-span-2">
                <label for="message" class="block text-sm font-semibold leading-6 text-gray-900"
                  >Message</label
                >
                <div class="mt-2.5">
                  <textarea
                    name="message"
                    id="message"
                    rows="4"
                    class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  ></textarea>
                </div>
              </div>
              <div class="flex gap-x-4 sm:col-span-2">
                <div class="flex h-6 items-center">
                  <button
                    type="button"
                    class="flex w-8 flex-none cursor-pointer rounded-full bg-gray-200 p-px ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    role="switch"
                    aria-checked="false"
                    aria-labelledby="switch-1-label"
                  >
                    <span class="sr-only">Agree to policies</span>
                    <span
                      aria-hidden="true"
                      class="h-4 w-4 translate-x-0 transform rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 transition duration-200 ease-in-out"
                    ></span>
                  </button>
                </div>
                <label class="text-sm leading-6 text-gray-600" id="switch-1-label">
                  By selecting this, you agree to our
                  <a href="#" class="font-semibold text-indigo-600">privacy&nbsp;policy</a>.
                </label>
              </div>
            </div>
            <div class="mt-10">
              <button
                type="submit"
                class="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>`;

const impressumHtml = `<div class="bg-white py-24 sm:py-32">
  <div class="mx-auto max-w-4xl px-6 lg:px-8">
    <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">Impressum</h2>
    <div class="space-y-4 text-gray-700 leading-relaxed">
      <p><strong>Sprachschule Mank</strong><br />Inhaberin: Fulya Mank</p>
      <p>E-Mail: info@sprachschulemank.com<br />Telefon: +49 123 456 7890</p>
    </div>
  </div>
</div>`;

const PAGES = [
    { title: 'Home', slug: 'home', content: homeHtml, show_in_nav: false, order: 1 },
    { title: 'About Me', slug: 'about', content: aboutHtml, show_in_nav: true, order: 2 },
    { title: 'Media', slug: 'media', content: mediaHtml, show_in_nav: true, order: 3 },
    { title: 'Contact', slug: 'contact', content: contactHtml, show_in_nav: true, order: 4 },
    { title: 'Impressum', slug: 'impressum', content: impressumHtml, show_in_nav: true, order: 5 },
];

const SAMPLE_COURSES = [
    {
        title: 'German Basics',
        description: 'Learn fundamental German grammar and vocabulary',
        language: 'Deutsch',
        level: 'Beginner',
        thumbnail: 'https://picsum.photos/800/600?seed=1',
        status: 'active',
        duration: 3,
        days: 'Tuesday & Thursday',
        time: '10:00 AM - 12:00 PM',
        price_extern: 150,
        price_intern: 100,
        is_open_for_enrollment: true,
    },
    {
        title: 'German Conversation',
        description: 'Improve your speaking and listening skills',
        language: 'Deutsch',
        level: 'Intermediate',
        thumbnail: 'https://picsum.photos/800/600?seed=2',
        status: 'active',
        duration: 2,
        days: 'Monday & Wednesday',
        time: '2:00 PM - 4:00 PM',
        price_extern: 200,
        price_intern: 150,
        is_open_for_enrollment: false,
    },
];

const img = (photo) => `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=800&q=80`;

const SAMPLE_EVENTS = [
    {
        title: 'Sommerfest 2026',
        slug: 'sommerfest-2026',
        description: 'Ein sonniger Tag voller Sprache: Bei unserem Sommerfest haben Lernende und Lehrende ' +
            'gemeinsam gefeiert, neue Freundschaften geschlossen und die Sprachkurse bei Musik und gutem Essen gefeiert.',
        event_date: '2026-07-18',
        cover_image: img('photo-1492684223066-81342ee5ff30'),
        is_public: true,
        order: 1,
        photos: [
            { url: img('photo-1492684223066-81342ee5ff30'), caption: 'Volles Haus beim Sommerfest' },
            { url: img('photo-1529333166437-7750a6dd5a70'), caption: 'Spaß in der ganzen Gruppe' },
            { url: img('photo-1524178232363-1fb2b075b655'), caption: 'Kultureller Austausch' },
            { url: img('photo-1522202176988-66273c2fd55f'), caption: 'Unsere Lernenden zusammen' },
            { url: img('photo-1521791136064-7986c2920216'), caption: 'Gemeinsame Aktivität' },
            { url: 'https://picsum.photos/seed/unterrichten/800/600', caption: 'Unterricht zum Mitmachen' },
        ],
    },
    {
        title: 'Abitur-Feier',
        slug: 'abitur-feier',
        description: 'Herzlichen Glückwunsch, Abiturienten! Wir haben gemeinsam die bestandene Prüfung ' +
            'und den erfolgreichen Abschluss gefeiert – ein Moment, auf den die Lernenden lange hingearbeitet haben.',
        event_date: '2026-06-15',
        cover_image: img('photo-1524178232363-1fb2b075b655'),
        is_public: true,
        order: 2,
        photos: [
            { url: img('photo-1524178232363-1fb2b075b655'), caption: 'Stolze Abschlusskandidaten' },
            { url: img('photo-1544717297-fa95b6ee9643'), caption: 'Lernende bei der Abiturfeier' },
            { url: img('photo-1529333166437-7750a6dd5a70'), caption: 'Feierstimmung im Klassenzimmer' },
            { url: img('photo-1522202176988-66273c2fd55f'), caption: 'Die gesamte Abschlussklasse' },
            { url: img('photo-1517245386807-bb43f82c33c4'), caption: 'Reden und Eröffnungszeremonie' },
            { url: img('photo-1513633263277-30a4150f7687'), caption: 'Letzte Stunde vor der Feier' },
        ],
    },
    {
        title: 'Weihnachtsfeier 2025',
        slug: 'weihnachtsfeier-2025',
        description: 'Zur Weihnachtszeit haben wir bei Glühwein und Plätzchen gemeinsam auf ein erfolgreiches ' +
            'Schuljahr zurückgeblickt und den Lernenden für ihr Engagement gedankt.',
        event_date: '2025-12-19',
        cover_image: img('photo-1552664730-d307ca884978'),
        is_public: true,
        order: 3,
        photos: [
            { url: img('photo-1552664730-d307ca884978'), caption: 'Festliche Stimmung' },
            { url: img('photo-1542626991-cbc4e32524cc'), caption: 'Weihnachtsfeier' },
            { url: img('photo-1513633263277-30a4150f7687'), caption: 'Weihnachtlicher Unterricht' },
            { url: img('photo-1521791136064-7986c2920216'), caption: 'Gemeinsam feiern' },
            { url: img('photo-1522202176988-66273c2fd55f'), caption: 'Lernende und Lehrende zusammen' },
            { url: img('photo-1529333166437-7750a6dd5a70'), caption: 'Lachen und Feiern' },
        ],
    },
];

// Seed the default site pages and sample courses, but only on the very first run.
async function seedContent() {
    const pageCount = await client.query(`SELECT COUNT(*)::int AS count FROM pages`);
    if (pageCount.rows[0].count === 0) {
        for (const page of PAGES) {
            await new Page(page.title, page.slug, page.content, page.show_in_nav, page.order).save();
        }
        console.log(`Seeded ${PAGES.length} default pages`);
    }

    const courseCount = await client.query(`SELECT COUNT(*)::int AS count FROM courses`);
    if (courseCount.rows[0].count === 0) {
        const teacherRes = await client.query(
            `SELECT id FROM users WHERE role IN ('admin', 'teacher') ORDER BY id LIMIT 1`
        );
        const teacherId = teacherRes.rows[0]?.id;
        if (teacherId) {
            for (const course of SAMPLE_COURSES) {
                await new Course(teacherId, course.title, course.description, course.language,
                    course.level, course.thumbnail, course.status, course.duration, course.days,
                    course.time, course.price_extern, course.price_intern,
                    course.is_open_for_enrollment).save();
            }
            console.log(`Seeded ${SAMPLE_COURSES.length} sample courses`);
        } else {
            console.log('No teacher/admin user found, skipping course seed');
        }
    }

    const eventCount = await client.query(`SELECT COUNT(*)::int AS count FROM events`);
    if (eventCount.rows[0].count === 0) {
        for (const event of SAMPLE_EVENTS) {
            await Event.createEvent(event);
        }
        console.log(`Seeded ${SAMPLE_EVENTS.length} sample events`);
    }
}

module.exports = seedContent;
